import type { ModeCapabilities } from '@/components/common/map/getModeConfig.ts';
import { getPhantomPointStyle } from '@/components/common/map/map-styles.ts';
import {
	addShapeVertex,
	addTraceVertex,
	getVertexIndex,
} from '@/components/common/map/vertex-geometry.ts';
import type { TimerID } from '@getodk/common/types/timers.ts';
import { Map, MapBrowserEvent } from 'ol';
import Feature from 'ol/Feature';
import { LineString, Point, Polygon } from 'ol/geom';
import { Modify, Translate } from 'ol/interaction';
import PointerInteraction from 'ol/interaction/Pointer';
import VectorLayer from 'ol/layer/Vector';
import WebGLVectorLayer from 'ol/layer/WebGLVector';
import type { Pixel } from 'ol/pixel';
import type VectorSource from 'ol/source/Vector';
import { shallowRef } from 'vue';

const DRAW_FEATURE_TYPES = {
	SHAPE: 'shape',
	TRACE: 'trace',
} as const;
export type DrawFeatureType = (typeof DRAW_FEATURE_TYPES)[keyof typeof DRAW_FEATURE_TYPES];

export interface UseMapInteractions {
	removeMapInteractions: () => void;
	setupFeatureDrag: (layer: VectorLayer, onDrag: (feature: Feature) => void) => void;
	setupLongPressPoint: (source: VectorSource, onLongPress: (feature: Feature) => void) => void;
	setupMapVisibilityObserver: (mapContainer: HTMLElement, onMapNotVisible: () => void) => void;
	setupPhantomMiddlePoint: (source: VectorSource) => void;
	teardownMap: () => void;
	toggleSelectEvent: (
		bindClick: boolean,
		onSelect?: (feature: Feature | undefined, vertexIndex: number | undefined) => void
	) => void;
}

const LONG_PRESS_TIME = 1000;

export function useMapInteractions(
	mapInstance: Map,
	capabilities: ModeCapabilities,
	drawFeatureType: DrawFeatureType | undefined
): UseMapInteractions {
	const currentLocationObserver = shallowRef<IntersectionObserver | undefined>();
	const pointerInteraction = shallowRef<PointerInteraction | undefined>();
	const translateInteraction = shallowRef<Translate | undefined>();
	const modifyInteraction = shallowRef<Modify | undefined>();

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
		removeLongPressPoint();
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
		setCursor(hit ? 'pointer' : '');
	};

	const onSelectFeature = (
		event: MapBrowserEvent,
		onSelect?: (feature: Feature | undefined) => void
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
		onSelect?: (feature: Feature | undefined, selectedVertexIndex: number | undefined) => void
	): void => {
		const hitFeatures = mapInstance.getFeaturesAtPixel(event.pixel, {
			layerFilter: (layer) => layer instanceof VectorLayer,
		});

		const feature = hitFeatures?.find((item) => {
			const geometry = item.getGeometry();
			return geometry instanceof Polygon || geometry instanceof LineString;
		}) as Feature<LineString | Polygon> | undefined;

		const vertexToSelect = hitFeatures?.find((item) => {
			return item.getGeometry() instanceof Point;
		}) as Feature<Point> | undefined;

		if (onSelect) {
			onSelect(feature, getVertexIndex(feature, vertexToSelect));
		}
	};

	const toggleSelectEvent = (
		bindClick: boolean,
		onSelect?: (feature: Feature | undefined, vertexIndex?: number) => void
	) => {
		const onClick = (event: MapBrowserEvent) => {
			if (capabilities.canLoadMultiFeatures) {
				onSelectFeature(event, onSelect);
				return;
			}
			if (capabilities.canSelectVertices) {
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

	const setupLongPressPoint = (source: VectorSource, onLongPress: (feature: Feature) => void) => {
		if (pointerInteraction.value) {
			return;
		}

		let timer: TimerID | undefined;
		let startPixel: Pixel | null = null;
		const HIT_TOLERANCE = 5;
		const clearTimer = () => {
			clearTimeout(timer);
			timer = undefined;
			startPixel = null;
			setCursor('');
		};

		pointerInteraction.value = new PointerInteraction({
			handleDownEvent: (event) => {
				startPixel = event.pixel;
				setCursor('pointer');
				if (timer) {
					clearTimeout(timer);
				}

				timer = setTimeout(() => {
					if (!startPixel || !timer) {
						return false;
					}

					let feature = source.getFeatures()[0];
					const resolution = mapInstance.getView().getResolution() ?? 1;

					if (!drawFeatureType) {
						if (!source.isEmpty()) {
							source.clear(true);
						}
						feature = new Feature({ geometry: new Point(event.coordinate) });
					}

					if (drawFeatureType === DRAW_FEATURE_TYPES.TRACE) {
						feature = addTraceVertex(resolution, event.coordinate, feature, HIT_TOLERANCE);
					}

					if (drawFeatureType === DRAW_FEATURE_TYPES.SHAPE) {
						feature = addShapeVertex(resolution, event.coordinate, feature, HIT_TOLERANCE);
					}

					if (feature) {
						if (source.isEmpty()) {
							source.addFeature(feature);
						}
						onLongPress(feature);
					}

					clearTimer();
				}, LONG_PRESS_TIME);
				return false;
			},
			handleMoveEvent: (event) => {
				if (!startPixel?.length || !timer || !event.pixel?.length) {
					return;
				}

				const [eventX, eventY] = event.pixel as [number, number];
				const [startX, startY] = startPixel as [number, number];
				const distanceX = Math.abs(eventX - startX);
				const distanceY = Math.abs(eventY - startY);
				if (distanceX > HIT_TOLERANCE || distanceY > HIT_TOLERANCE) {
					clearTimer();
				}
			},
		});

		mapInstance.addInteraction(pointerInteraction.value);
	};

	const removeLongPressPoint = () => {
		if (pointerInteraction.value) {
			mapInstance.removeInteraction(pointerInteraction.value);
			pointerInteraction.value = undefined;
		}
	};

	const setupFeatureDrag = (layer: VectorLayer, onDrag: (feature: Feature) => void) => {
		if (translateInteraction.value) {
			return;
		}

		translateInteraction.value = new Translate({ layers: [layer] });

		translateInteraction.value.on('translating', () => setCursor('grab'));

		translateInteraction.value.on('translateend', (event) => {
			setCursor('');
			const feature = event.features.getArray()[0];
			if (feature) {
				onDrag(feature);
			}
		});

		mapInstance.addInteraction(translateInteraction.value);
	};

	const setupPhantomMiddlePoint = (source: VectorSource) => {
		if (modifyInteraction.value) {
			return;
		}

		modifyInteraction.value = new Modify({
			source: source,
			style: getPhantomPointStyle(),
			insertVertexCondition: (event) => event.type === 'pointermove',
		});

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

	const teardownMap = () => {
		currentLocationObserver.value?.disconnect();
		removeMapInteractions();
	};

	return {
		removeMapInteractions,
		setupFeatureDrag,
		setupLongPressPoint,
		setupMapVisibilityObserver,
		setupPhantomMiddlePoint,
		teardownMap,
		toggleSelectEvent,
	};
}
