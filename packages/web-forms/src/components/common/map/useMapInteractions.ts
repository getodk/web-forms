import type { ModeCapabilities } from '@/components/common/map/getModeConfig.ts';
import { getPhantomPointStyle } from '@/components/common/map/map-styles.ts';
import { Map, MapBrowserEvent } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import Feature from 'ol/Feature';
import { Point, LineString, Polygon } from 'ol/geom';
import { Modify, Translate } from 'ol/interaction';
import PointerInteraction from 'ol/interaction/Pointer';
import VectorLayer from 'ol/layer/Vector';
import WebGLVectorLayer from 'ol/layer/WebGLVector';
import type { Pixel } from 'ol/pixel';
import type { TimerID } from '@getodk/common/types/timers.ts';
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

	const getVertexIndex = (
		feature: Feature<LineString | Polygon> | undefined,
		vertexToSelect: Feature<Point> | undefined
	) => {
		const featureGeometry = feature?.getGeometry();
		const vertexGeometry = vertexToSelect?.getGeometry();
		if (!featureGeometry || !vertexGeometry) {
			return;
		}

		const vertexCoords = vertexGeometry.getCoordinates();
		const featureCoords =
			featureGeometry instanceof Polygon
				? featureGeometry.getCoordinates().flat()
				: featureGeometry.getCoordinates();

		const index = featureCoords.findIndex(
			(coords) => coords[0] === vertexCoords[0] && coords[1] === vertexCoords[1]
		);
		return index === -1 ? undefined : index;
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

	const addPoint = (source: VectorSource, coordinates: Coordinate): Feature => {
		if (!source.isEmpty()) {
			source.clear(true);
		}

		const feature = new Feature({ geometry: new Point(coordinates) });
		source.addFeature(feature);
		return feature;
	};

	const addTraceVertex = (
		source: VectorSource,
		coordinates: Coordinate,
		feature: Feature | undefined
	) => {
		if (!feature) {
			const newFeature = new Feature({
				geometry: new LineString([coordinates]),
			});
			source.addFeature(newFeature);
			return newFeature;
		}

		const geometry = (feature as Feature<LineString>).getGeometry();
		geometry?.appendCoordinate(coordinates);
		return feature;
	};

	const addShapeVertex = (
		source: VectorSource,
		coordinates: Coordinate,
		feature: Feature | undefined
	) => {
		if (!feature) {
			const newFeature = new Feature({
				geometry: new Polygon([[coordinates]]),
			});
			source.addFeature(newFeature);
			return newFeature;
		}

		const geometry = (feature as Feature<Polygon>).getGeometry();
		const ring = geometry?.getCoordinates()?.[0] ?? [];

		if (ring.length < 3) {
			ring.push(coordinates);
		} else {
			ring.splice(ring.length - 1, 0, coordinates);
		}

		const firstVertex = ring[0];
		if (ring.length >= 3 && firstVertex && !isShapeClosed(ring)) {
			// Autoclose if it's not closed yet.
			ring.push([...firstVertex]);
		}
		geometry?.setCoordinates([ring]);
	};

	const isShapeClosed = (ring: Coordinate[]) => {
		const first = ring[0];
		const last = ring[ring.length - 1];
		return first && last && first[0] === last[0] && first[1] === last[1];
	};

	const setupLongPressPoint = (source: VectorSource, onLongPress: (feature: Feature) => void) => {
		if (pointerInteraction.value) {
			return;
		}

		let timer: TimerID | null = null;
		let startPixel: Pixel | null = null;
		const pixelTolerance = 5;

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

					const coord = event.coordinate;
					let feature = source.getFeatures()[0];

					if (!drawFeatureType) {
						feature = addPoint(source, coord);
					}

					if (drawFeatureType === DRAW_FEATURE_TYPES.TRACE) {
						feature = addTraceVertex(source, coord, feature);
					}

					if (drawFeatureType === DRAW_FEATURE_TYPES.SHAPE) {
						feature = addShapeVertex(source, coord, feature);
					}

					if (feature) {
						onLongPress(feature);
					}
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
				if (distanceX > pixelTolerance || distanceY > pixelTolerance) {
					clearTimeout(timer);
					timer = null;
					startPixel = null;
					setCursor('');
				}
			},
			handleUpEvent: () => {
				setCursor('');
				if (timer) {
					clearTimeout(timer);
				}
				return false;
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
		if (!drawFeatureType) {
			setupFeaturePointDrag(layer, onDrag);
			return;
		}

		setupVertexDrag(layer, onDrag);
	};

	const setupFeaturePointDrag = (layer: VectorLayer, onDrag: (feature: Feature) => void) => {
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

	const setupVertexDrag = (layer: VectorLayer, onDrag: (feature: Feature) => void) => {
		if (modifyInteraction.value) {
			return;
		}

		modifyInteraction.value = new Modify({
			source: layer.getSource() as VectorSource,
			style: getPhantomPointStyle(),
		});

		modifyInteraction.value.on('modifystart', () => setCursor('grabbing'));

		modifyInteraction.value.on('modifyend', (event) => {
			setCursor('');
			const feature = event.features.getArray()[0];
			if (feature) {
				onDrag(feature);
			}
		});

		mapInstance.addInteraction(modifyInteraction.value);
	};

	const removeFeatureDrag = () => {
		if (translateInteraction.value) {
			mapInstance.removeInteraction(translateInteraction.value);
			translateInteraction.value = undefined;
		}

		if (modifyInteraction.value) {
			mapInstance.removeInteraction(modifyInteraction.value);
			modifyInteraction.value = undefined;
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
		teardownMap,
		toggleSelectEvent,
	};
}
