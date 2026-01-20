import type { ModeCapabilities } from '@/components/common/map/getModeConfig.ts';
import { getPhantomPointStyle } from '@/components/common/map/map-styles.ts';
import {
	IS_SELECTED_PROPERTY,
	SELECTED_VERTEX_INDEX_PROPERTY,
} from '@/components/common/map/useMapFeatures.ts';
import {
	addShapeVertex,
	addTraceVertex,
	getFlatCoordinates,
	getVertexIndex,
} from '@/components/common/map/vertex-geometry.ts';
import { Collection, Map, MapBrowserEvent } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import Feature from 'ol/Feature';
import { LineString, Point, Polygon } from 'ol/geom';
import { Modify, Translate } from 'ol/interaction';
import VectorLayer from 'ol/layer/Vector';
import WebGLVectorLayer from 'ol/layer/WebGLVector';
import type VectorSource from 'ol/source/Vector';
import { shallowRef } from 'vue';

export const DRAW_FEATURE_TYPES = {
	SHAPE: 'shape',
	TRACE: 'trace',
} as const;
export type DrawFeatureType = (typeof DRAW_FEATURE_TYPES)[keyof typeof DRAW_FEATURE_TYPES];

export interface UseMapInteractions {
	hasPreviousFeatureState: () => boolean;
	popPreviousFeatureState: () => Feature | null | undefined;
	removeMapInteractions: () => void;
	savePreviousFeatureState: (feature: Feature | null) => void;
	setupFeatureDrag: (layer: VectorLayer, onDrag: (feature: Feature) => void) => void;
	setupTapToAddVertex: (source: VectorSource, onAdd: (feature: Feature) => void) => void;
	setupMapVisibilityObserver: (mapContainer: HTMLElement, onMapNotVisible: () => void) => void;
	setupVertexDrag: (source: VectorSource, onDrag: (feature: Feature) => void) => void;
	teardownMap: () => void;
	toggleSelectEvent: (
		bindClick: boolean,
		onSelect: (feature: Feature | undefined, vertexIndex: number | undefined) => void
	) => void;
}

const ADD_VERTEX_HIT_TOLERANCE = 20;
const SELECT_HIT_TOLERANCE = 15;

export function useMapInteractions(
	mapInstance: Map,
	capabilities: ModeCapabilities,
	drawFeatureType: DrawFeatureType | undefined
): UseMapInteractions {
	const currentLocationObserver = shallowRef<IntersectionObserver | undefined>();
	const tapListener = shallowRef<((event: MapBrowserEvent) => void) | undefined>();
	const translateInteraction = shallowRef<Translate | undefined>();
	const modifyInteraction = shallowRef<Modify | undefined>();
	const previousFeatureState = shallowRef<Feature | null | undefined>();

	const setupMapVisibilityObserver = (mapContainer: HTMLElement, onMapNotVisible: () => void) => {
		if ('IntersectionObserver' in window) {
			currentLocationObserver.value = new IntersectionObserver(
				([entry]) => {
					if (!entry?.isIntersecting) {
						onMapNotVisible();
					}
				},
				{ root: null, threshold: 0 }
			);
			currentLocationObserver.value.observe(mapContainer);
		}
	};

	const removeMapInteractions = () => {
		toggleSelectEvent(false);
		removeTapToAddVertex();
		removeFeatureDrag();
		removePhantomMiddlePoint();
	};

	const setCursor = (cursor: string) => (mapInstance.getTargetElement().style.cursor = cursor);

	const setCursorPointerForSelect = (event: MapBrowserEvent) => {
		if (event.dragging || !mapInstance) {
			return;
		}

		const hit = mapInstance.hasFeatureAtPixel(event.pixel, {
			layerFilter: (layer) => layer instanceof WebGLVectorLayer,
		});
		setCursor(hit ? 'pointer' : 'default');
	};

	const onSelectFeature = (
		event: MapBrowserEvent,
		onSelect: (feature: Feature | undefined) => void
	): void => {
		const hitFeatures = mapInstance.getFeaturesAtPixel(event.pixel, {
			layerFilter: (layer) => layer instanceof WebGLVectorLayer,
		});

		const featureToSelect = hitFeatures?.length ? (hitFeatures[0] as Feature) : undefined;
		if (onSelect) {
			onSelect(featureToSelect);
		}
	};

	const onSelectFeatureOrVertex = (
		event: MapBrowserEvent,
		onSelect: (feature: Feature | undefined, selectedVertexIndex: number | undefined) => void
	): void => {
		const hitFeatures = mapInstance.getFeaturesAtPixel(event.pixel, {
			layerFilter: (layer) => layer instanceof VectorLayer,
			hitTolerance: SELECT_HIT_TOLERANCE,
		});

		const selectedFeature = hitFeatures?.find((item) => {
			const geometry = item.getGeometry();
			return geometry instanceof Polygon || geometry instanceof LineString;
		}) as Feature<LineString | Polygon> | undefined;

		if (!selectedFeature) {
			onSelect?.(undefined, undefined);
			return;
		}

		const coords = getFlatCoordinates(selectedFeature.getGeometry());
		if (coords.length === 1) {
			onSelect?.(selectedFeature, 0);
			return;
		}

		const vertexToSelect = hitFeatures.find((item) => item.getGeometry() instanceof Point);
		const index = getVertexIndex(selectedFeature, vertexToSelect as Feature<Point> | undefined);
		onSelect?.(selectedFeature, index);
	};

	const toggleSelectEvent = (
		bindClick: boolean,
		onSelect?: (feature: Feature | undefined, vertexIndex?: number) => void
	) => {
		if (!onSelect) {
			return;
		}

		const onClick = (event: MapBrowserEvent) => {
			if (capabilities.canLoadMultiFeatures) {
				onSelectFeature(event, onSelect);
				return;
			}
			if (capabilities.canSelectFeatureOrVertex) {
				onSelectFeatureOrVertex(event, onSelect);
				return;
			}
		};
		mapInstance.un('click', onClick);
		mapInstance.un('pointermove', setCursorPointerForSelect);

		if (bindClick) {
			mapInstance.on('click', onClick);
			mapInstance.on('pointermove', setCursorPointerForSelect);
		}
	};

	const resolveFeatureForTapToAdd = (
		coordinate: Coordinate,
		resolution: number,
		feature: Feature | undefined
	) => {
		if (drawFeatureType === DRAW_FEATURE_TYPES.SHAPE) {
			return addShapeVertex(resolution, coordinate, feature, ADD_VERTEX_HIT_TOLERANCE);
		}

		if (drawFeatureType === DRAW_FEATURE_TYPES.TRACE) {
			return addTraceVertex(resolution, coordinate, feature, ADD_VERTEX_HIT_TOLERANCE);
		}

		return new Feature({ geometry: new Point(coordinate) });
	};

	const preventContextMenu = (e: Event) => e.preventDefault();

	const setupTapToAddVertex = (source: VectorSource, onAdd: (feature: Feature) => void) => {
		if (tapListener.value) {
			return;
		}

		const listener = (event: MapBrowserEvent) => {
			if (event.dragging) {
				return;
			}

			const resolution = mapInstance.getView().getResolution() ?? 1;
			const feature = source.getFeatures()?.[0];
			savePreviousFeatureState(feature ?? null);
			const updatedFeature = resolveFeatureForTapToAdd(event.coordinate, resolution, feature)!;

			if (!drawFeatureType && !source.isEmpty()) {
				source.clear(true);
			}

			if (source.isEmpty()) {
				source.addFeature(updatedFeature);
			}

			onAdd(updatedFeature);
		};

		tapListener.value = listener;
		mapInstance.on('click', listener);
		mapInstance.getViewport().addEventListener('contextmenu', preventContextMenu);
	};

	const removeTapToAddVertex = () => {
		if (tapListener.value) {
			mapInstance.un('click', tapListener.value);
			tapListener.value = undefined;
			setCursor('default');
		}
	};

	const onDragFeature = (features: Collection<Feature>, onDrag: (feature: Feature) => void) => {
		setCursor('default');
		const feature = features.getArray()?.[0];
		if (feature) {
			onDrag(feature);
		}
	};

	const setupFeatureDrag = (layer: VectorLayer, onDrag: (feature: Feature) => void) => {
		if (translateInteraction.value) {
			return;
		}

		translateInteraction.value = new Translate({ layers: [layer] });
		translateInteraction.value.on('translating', () => setCursor('grab'));
		translateInteraction.value.on('translateend', (event) => onDragFeature(event.features, onDrag));
		mapInstance.addInteraction(translateInteraction.value);
	};

	const setupVertexDrag = (source: VectorSource, onDrag: (feature: Feature) => void) => {
		if (modifyInteraction.value) {
			return;
		}

		modifyInteraction.value = new Modify({
			source: source,
			style: getPhantomPointStyle(),
			pixelTolerance: SELECT_HIT_TOLERANCE,
			insertVertexCondition: (event) => event.type === 'pointermove',
			wrapX: false,
		});

		modifyInteraction.value.on('modifystart', () => {
			setCursor('grab');
			savePreviousFeatureState(source.getFeatures()?.[0] ?? null);
		});
		modifyInteraction.value.on('modifyend', (event) => onDragFeature(event.features, onDrag));
		mapInstance.addInteraction(modifyInteraction.value);
	};

	const removePhantomMiddlePoint = () => {
		if (modifyInteraction.value) {
			mapInstance.removeInteraction(modifyInteraction.value);
			modifyInteraction.value = undefined;
		}
	};

	const removeFeatureDrag = () => {
		if (translateInteraction.value) {
			mapInstance.removeInteraction(translateInteraction.value);
			translateInteraction.value = undefined;
		}
	};

	const savePreviousFeatureState = (feature: Feature | null) => {
		if (!capabilities.canUndoLastChange) {
			return;
		}

		if (!feature) {
			previousFeatureState.value = null;
			return;
		}

		previousFeatureState.value = feature.clone();
		previousFeatureState.value.unset(SELECTED_VERTEX_INDEX_PROPERTY);
		previousFeatureState.value.unset(IS_SELECTED_PROPERTY);
	};

	const popPreviousFeatureState = () => {
		const feature = previousFeatureState.value;
		previousFeatureState.value = undefined; // Undefined means no state to restore.
		return feature;
	};

	const hasPreviousFeatureState = () => previousFeatureState.value !== undefined;

	const teardownMap = () => {
		currentLocationObserver.value?.disconnect();
		currentLocationObserver.value = undefined;
		removeMapInteractions();
		mapInstance.getViewport().removeEventListener('contextmenu', preventContextMenu);
	};

	return {
		hasPreviousFeatureState,
		popPreviousFeatureState,
		removeMapInteractions,
		savePreviousFeatureState,
		setupFeatureDrag,
		setupTapToAddVertex,
		setupMapVisibilityObserver,
		setupVertexDrag,
		teardownMap,
		toggleSelectEvent,
	};
}
