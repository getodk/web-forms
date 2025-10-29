import { getModeConfig, type Mode } from '@/components/common/map/getModeConfig.ts';
import {
	getSavedStyles,
	getSelectedStyles,
	getUnselectedStyles,
} from '@/components/common/map/map-styles.ts';
import type { FeatureCollection, Feature as GeoJsonFeature, GeoJsonProperties } from 'geojson';
import { Map, MapBrowserEvent, View } from 'ol';
import { Attribution, Zoom } from 'ol/control';
import { getCenter } from 'ol/extent';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import { LineString, Point, Polygon } from 'ol/geom';
import { Translate } from 'ol/interaction';
import PointerInteraction from 'ol/interaction/Pointer';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import WebGLVectorLayer from 'ol/layer/WebGLVector';
import type { Pixel } from 'ol/pixel';
import { fromLonLat, toLonLat } from 'ol/proj';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import { Icon, Style } from 'ol/style';
import { computed, shallowRef, watch } from 'vue';
import { get as getProjection } from 'ol/proj';
import locationIcon from '@/assets/images/location-icon.svg';
import type { TimerID } from '@getodk/common/types/timers.ts';

type GeometryType = LineString | Point | Polygon;
type LocationWatchID = ReturnType<typeof navigator.geolocation.watchPosition>;
interface BrowserLocation
	extends Pick<GeolocationCoordinates, 'accuracy' | 'altitude' | 'latitude' | 'longitude'> {}

export const STATES = {
	LOADING: 'loading',
	READY: 'ready',
	ERROR: 'error',
	CAPTURING: 'capturing',
} as const;

const DEFAULT_GEOJSON_PROJECTION = 'EPSG:4326';
const DEFAULT_VIEW_PROJECTION = 'EPSG:3857';
const DEFAULT_VIEW_CENTER = [0, 0];
const MAX_ZOOM = 19;
const MIN_ZOOM = 2;
const GEOLOCATION_TIMEOUT_MS = 30 * 1000; // Field environments need more time and reduces false “no signal” warnings.
const ANIMATION_TIME = 1000;
const LONG_PRESS_TIME = 1000;
const SMALL_DEVICE_WIDTH = 576;
const FEATURE_ID_PROPERTY = 'odk_feature_id';
const ODK_VALUE_PROPERTY = 'odk_value';
const SAVED_ID_PROPERTY = 'savedId';
const SELECTED_ID_PROPERTY = 'selectedId';

export function useMapBlock(mode: Mode, onFeaturePlacement: () => void) {
	let mapInstance: Map | undefined;
	const currentMode = getModeConfig(mode);

	const currentState = shallowRef<(typeof STATES)[keyof typeof STATES]>(STATES.LOADING);
	const errorMessage = shallowRef<{ title: string; message: string } | undefined>();
	const watchLocation = shallowRef<LocationWatchID | undefined>();
	const currentLocationObserver = shallowRef<IntersectionObserver | undefined>();
	const pointerInteraction = shallowRef<PointerInteraction | undefined>();
	const translateInteraction = shallowRef<Translate | undefined>();

	const userCurrentLocation = shallowRef<BrowserLocation | undefined>();
	const userCurrentLocationFeature = shallowRef<Feature<Point> | undefined>();
	const savedFeature = shallowRef<Feature<GeometryType> | undefined>();
	const selectedFeature = shallowRef<Feature<GeometryType> | undefined>();
	const selectedFeatureProperties = computed(() => {
		return selectedFeature.value?.getProperties();
	});

	const featuresSource = new VectorSource();
	const multiFeatureLayer = new WebGLVectorLayer({
		source: featuresSource,
		style: [
			...getUnselectedStyles(FEATURE_ID_PROPERTY, SELECTED_ID_PROPERTY, SAVED_ID_PROPERTY),
			...getSelectedStyles(FEATURE_ID_PROPERTY, SELECTED_ID_PROPERTY, SAVED_ID_PROPERTY),
			...getSavedStyles(FEATURE_ID_PROPERTY, SAVED_ID_PROPERTY),
		],
		variables: { [SAVED_ID_PROPERTY]: '', [SELECTED_ID_PROPERTY]: '' },
	});
	const singleFeatureLayer = new VectorLayer({
		source: featuresSource,
		style: [...getSavedStyles(FEATURE_ID_PROPERTY, SAVED_ID_PROPERTY)],
	});

	const currentLocationSource = new VectorSource();
	const currentLocationLayer = new VectorLayer({
		source: currentLocationSource,
		style: new Style({ image: new Icon({ src: locationIcon }) }),
	});

	const initMap = (
		mapContainer: HTMLElement,
		geoJSON: FeatureCollection,
		savedFeatureValue: GeoJsonFeature | undefined
	): void => {
		if (!isWebGLAvailable()) {
			currentState.value = STATES.ERROR;
			errorMessage.value = {
				title: 'Graphics issue detected',
				message: 'Your browser cannot display the map now. Enable graphics acceleration settings.',
			};
			return;
		}

		if (mapInstance) {
			return;
		}

		mapInstance = new Map({
			target: mapContainer,
			layers: [new TileLayer({ source: new OSM() }), currentLocationLayer],
			view: new View({
				center: DEFAULT_VIEW_CENTER,
				zoom: MIN_ZOOM,
				// Prevent map cloning at low zoom during panning, which disrupts feature selection.
				multiWorld: false,
				projection: DEFAULT_VIEW_PROJECTION,
				extent: getProjection(DEFAULT_VIEW_PROJECTION)?.getExtent(),
			}),
			controls: [new Zoom(), new Attribution({ collapsible: false })],
		});

		setupMode(geoJSON, savedFeatureValue);
		currentState.value = STATES.READY;
		setupMapVisibilityObserver(mapContainer);
	};

	const setupMapVisibilityObserver = (mapContainer: HTMLElement) => {
		if ('IntersectionObserver' in window) {
			currentLocationObserver.value = new IntersectionObserver(
				([entry]) => {
					if (!entry.isIntersecting) {
						stopWatchingCurrentLocation();
					}
				},
				{ root: null, threshold: 0 }
			);
			currentLocationObserver.value.observe(mapContainer);
		}
	};

	const isWebGLAvailable = () => {
		try {
			const canvas = document.createElement('canvas');
			return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
		} catch {
			return false;
		}
	};

	const setupMode = (geoJSON: FeatureCollection, savedFeatureValue: GeoJsonFeature | undefined) => {
		if (!mapInstance) {
			return;
		}

		if (currentMode.capabilities.canLoadMultiFeatures) {
			mapInstance.addLayer(multiFeatureLayer);
			updateFeatureCollection(geoJSON, savedFeatureValue);
			return;
		}

		mapInstance.addLayer(singleFeatureLayer);
		// TODO: extend to LineString and Polygon types
		if (savedFeatureValue && savedFeatureValue.geometry.type === 'Point') {
			const [longitude, latitude] = savedFeatureValue.geometry.coordinates;
			const feature = loadSingleFeature(longitude, latitude, savedFeatureValue.properties);
			saveFeature(feature);
		}
	};

	const removeMapInteractions = () => {
		toggleClickBinding(false);
		removeLongPressPoint();
		removeFeatureDrag();
	};

	const setupMapInteractions = (isReadOnly: boolean) => {
		if (!mapInstance) {
			return;
		}

		removeMapInteractions();

		if (isReadOnly) {
			return;
		}

		if (currentMode.interactions.clickBinding) {
			toggleClickBinding(true);
		}

		if (currentMode.interactions.drag) {
			setupFeatureDrag();
		}

		if (currentMode.interactions.longPress) {
			setupLongPressPoint();
		}
	};

	const setCursorPointer = (event: MapBrowserEvent) => {
		if (event.dragging || !mapInstance) {
			return;
		}

		const hit = mapInstance.hasFeatureAtPixel(event.pixel, {
			layerFilter: (layer) => layer instanceof WebGLVectorLayer,
		});

		mapInstance.getTargetElement().style.cursor = hit ? 'pointer' : '';
	};

	const handleClick = (event: MapBrowserEvent) => selectFeatureByPosition(event.pixel);

	const toggleClickBinding = (bindClick: boolean) => {
		mapInstance?.un('click', handleClick);
		mapInstance?.un('pointermove', setCursorPointer);

		if (bindClick) {
			mapInstance?.on('click', handleClick);
			mapInstance?.on('pointermove', setCursorPointer);
		}
	};

	const fitToAllFeatures = (): void => {
		if (featuresSource.isEmpty()) {
			return;
		}

		const extent = featuresSource.getExtent();
		if (extent?.length) {
			mapInstance?.getView().fit(extent, {
				padding: [50, 50, 50, 50],
				duration: ANIMATION_TIME,
				maxZoom: MAX_ZOOM,
			});
		}
	};

	const stopWatchingCurrentLocation = () => {
		currentLocationSource.clear();
		userCurrentLocation.value = undefined;

		if (watchLocation.value) {
			navigator.geolocation.clearWatch(watchLocation.value);
			watchLocation.value = undefined;
		}
	};

	const watchCurrentLocation = (): void => {
		if (watchLocation.value) {
			mapInstance?.getView().animate({
				center: userCurrentLocationFeature.value?.getGeometry()?.getCoordinates(),
				zoom: MAX_ZOOM,
				duration: ANIMATION_TIME,
			});
			return;
		}

		const handleSucess = (position: GeolocationPosition) => {
			const { latitude, longitude, altitude, accuracy } = position.coords;
			userCurrentLocation.value = { latitude, longitude, altitude, accuracy };
			currentState.value = STATES.READY;
		};

		const handleError = () => {
			currentLocationSource.clear(true);
			currentState.value = STATES.ERROR;
			// TODO: translations
			errorMessage.value = {
				title: 'Cannot access location',
				message:
					'Grant location permission in the browser settings and make sure location is turned on.',
			};
		};

		if (!navigator.geolocation) {
			handleError();
		}

		currentState.value = STATES.CAPTURING;
		const options = { enableHighAccuracy: true, timeout: GEOLOCATION_TIMEOUT_MS };
		watchLocation.value = navigator.geolocation.watchPosition(handleSucess, handleError, options);
	};

	const centerFeatureLocation = (feature: Feature<GeometryType>): void => {
		const geometry = feature.getGeometry();
		const view = mapInstance?.getView();
		const mapWidth = mapInstance?.getSize()?.[0];
		if (!geometry || !view || mapWidth == null) {
			return;
		}

		const pixelOffsetY = mapWidth < SMALL_DEVICE_WIDTH ? -130 : 0;
		const pixelOffsetX = mapWidth < SMALL_DEVICE_WIDTH ? 0 : -70;

		const zoomResolution = view.getResolution() ?? 1;
		const xOffsetInMapUnits = -pixelOffsetX * zoomResolution;
		const yOffsetInMapUnits = -pixelOffsetY * zoomResolution;

		// Turning angles into usable numbers
		const rotation = view.getRotation();
		const cosRotation = Math.cos(rotation);
		const sinRotation = Math.sin(rotation);

		const [featureCenterLong, featureCenterLat] = getCenter(geometry.getExtent());
		const targetCoordinates = [
			featureCenterLong - xOffsetInMapUnits * cosRotation + yOffsetInMapUnits * sinRotation,
			featureCenterLat - xOffsetInMapUnits * sinRotation - yOffsetInMapUnits * cosRotation,
		];

		view.animate({
			center: targetCoordinates,
			duration: ANIMATION_TIME,
		});
	};

	const updateFeatureCollection = (
		newCollection: FeatureCollection,
		savedFeatureValue: GeoJsonFeature | undefined
	) => {
		loadFeatureCollection(newCollection);
		setSavedByValueProp(savedFeatureValue);
	};

	const emptyMap = () => {
		selectFeature(undefined);
		saveFeature(undefined);
		featuresSource.clear(true);
	};

	const loadSingleFeature = (
		longitude: number,
		latitude: number,
		properties: GeoJsonProperties
	): Feature<GeometryType> | undefined => {
		if (!mapInstance || currentMode.capabilities.canLoadMultiFeatures) {
			return;
		}

		currentState.value = STATES.LOADING;
		featuresSource.clear(true);

		const parsedCoords = fromLonLat([longitude, latitude]);
		const feature = new Feature({
			geometry: new Point(parsedCoords),
			...properties,
		});
		featuresSource.addFeature(feature);
		currentState.value = STATES.READY;

		fitToAllFeatures();

		return feature;
	};

	const loadFeatureCollection = (geoJSON: FeatureCollection): void => {
		if (!mapInstance || !currentMode.capabilities.canLoadMultiFeatures) {
			return;
		}

		currentState.value = STATES.LOADING;
		emptyMap();

		if (!geoJSON.features.length) {
			mapInstance?.getView().animate({
				center: DEFAULT_VIEW_CENTER,
				zoom: MIN_ZOOM,
				duration: ANIMATION_TIME,
			});
			currentState.value = STATES.READY;
			return;
		}

		const features = new GeoJSON().readFeatures(geoJSON, {
			dataProjection: DEFAULT_GEOJSON_PROJECTION,
			featureProjection: mapInstance.getView().getProjection(),
		});

		features.forEach((feature) => {
			if (!feature.get(FEATURE_ID_PROPERTY)) {
				feature.set(FEATURE_ID_PROPERTY, crypto.randomUUID());
			}
		});
		featuresSource.addFeatures(features);
		currentState.value = STATES.READY;

		fitToAllFeatures();
	};

	const selectFeatureByPosition = (position: Pixel): void => {
		const hitFeatures = mapInstance?.getFeaturesAtPixel(position, {
			layerFilter: (layer) => layer instanceof WebGLVectorLayer,
		});

		const featureToSelect = hitFeatures?.length
			? (hitFeatures[0] as Feature<GeometryType>)
			: undefined;

		selectFeature(featureToSelect);
	};

	const selectFeature = (feature?: Feature<GeometryType>) => (selectedFeature.value = feature);

	const saveFeature = (feature?: Feature<GeometryType>) => (savedFeature.value = feature);

	const setSavedByValueProp = (value: GeoJsonFeature | undefined): void => {
		if (!value || featuresSource.isEmpty()) {
			return;
		}

		const featureToSave = featuresSource.forEachFeature((feature) => {
			const featureProps = feature.getProperties();
			if (featureProps?.[ODK_VALUE_PROPERTY] === value.properties?.[ODK_VALUE_PROPERTY]) {
				return feature;
			}
		});

		if (!featureToSave) {
			return;
		}

		saveFeature(featureToSave as Feature<GeometryType>);
		centerFeatureLocation(featureToSave as Feature<GeometryType>);
	};

	const isSelectedFeatureSaved = (): boolean => {
		const savedId = savedFeature.value?.get(FEATURE_ID_PROPERTY) as string;
		const selectedId = selectedFeature.value?.get(FEATURE_ID_PROPERTY) as string;
		return savedId?.length > 0 && savedId === selectedId;
	};

	const formatODKValue = (longitude: number, latitude: number) => `${latitude} ${longitude}`;

	const setupLongPressPoint = () => {
		if (!mapInstance || pointerInteraction.value) {
			return;
		}

		let timer: TimerID | null = null;
		let startPixel: Pixel | null = null;
		const pixelTolerance = 5;

		pointerInteraction.value = new PointerInteraction({
			handleDownEvent: (event) => {
				startPixel = event.pixel;
				mapInstance!.getTargetElement().style.cursor = 'pointer';
				if (timer) {
					clearTimeout(timer);
				}

				timer = setTimeout(() => {
					if (!startPixel || !timer) {
						return false;
					}

					if (!featuresSource.isEmpty()) {
						featuresSource.clear(true);
					}

					const geometry = new Point(event.coordinate);
					const [longitude, latitude] = toLonLat(geometry.getCoordinates());
					const feature = new Feature({
						geometry: new Point(event.coordinate),
						[ODK_VALUE_PROPERTY]: formatODKValue(longitude, latitude),
					});
					featuresSource.addFeature(feature);
					saveFeature(feature);

					if (onFeaturePlacement) {
						onFeaturePlacement();
					}
				}, LONG_PRESS_TIME);
				return false;
			},
			handleMoveEvent: (event) => {
				if (!startPixel || !timer) {
					return;
				}

				const distanceX = Math.abs(event.pixel[0] - startPixel[0]);
				const distanceY = Math.abs(event.pixel[1] - startPixel[1]);
				if (distanceX > pixelTolerance || distanceY > pixelTolerance) {
					clearTimeout(timer);
					timer = null;
					startPixel = null;
					mapInstance!.getTargetElement().style.cursor = '';
				}
			},
			handleUpEvent: () => {
				mapInstance!.getTargetElement().style.cursor = '';
				if (timer) {
					clearTimeout(timer);
				}
				return false;
			},
		});

		mapInstance.addInteraction(pointerInteraction.value);
	};

	const removeLongPressPoint = () => {
		if (mapInstance && pointerInteraction.value) {
			mapInstance.removeInteraction(pointerInteraction.value);
			pointerInteraction.value = undefined;
		}
	};

	const setupFeatureDrag = () => {
		if (!mapInstance || translateInteraction.value) {
			return;
		}

		translateInteraction.value = new Translate({ layers: [singleFeatureLayer] });

		translateInteraction.value.on('translating', () => {
			mapInstance!.getTargetElement().style.cursor = 'grab';
		});

		translateInteraction.value.on('translateend', (event) => {
			mapInstance!.getTargetElement().style.cursor = '';
			const feature = event.features.getArray()[0] as Feature<Point>;
			if (!feature) {
				return;
			}

			const geometry = feature.getGeometry();
			if (!geometry) {
				return;
			}

			const [longitude, latitude] = toLonLat(geometry.getCoordinates());
			feature.set(ODK_VALUE_PROPERTY, formatODKValue(longitude, latitude));
			saveFeature(feature);
			if (onFeaturePlacement) {
				onFeaturePlacement();
			}
		});

		mapInstance.addInteraction(translateInteraction.value);
	};

	const removeFeatureDrag = () => {
		if (mapInstance && translateInteraction.value) {
			mapInstance.removeInteraction(translateInteraction.value);
			translateInteraction.value = undefined;
		}
	};

	const teardownMap = () => {
		stopWatchingCurrentLocation();
		currentLocationObserver.value?.disconnect();
		removeMapInteractions();
	};

	watch(
		() => currentState.value,
		(newState) => {
			if (newState !== STATES.ERROR) {
				errorMessage.value = undefined;
			}
		}
	);

	watch(
		() => selectedFeature.value,
		(newSelectedFeature) => {
			if (currentMode.capabilities.canLoadMultiFeatures) {
				multiFeatureLayer.updateStyleVariables({
					[SELECTED_ID_PROPERTY]: (newSelectedFeature?.get(FEATURE_ID_PROPERTY) as string) ?? '',
				});
			}

			if (newSelectedFeature != null) {
				centerFeatureLocation(newSelectedFeature);
			}
		}
	);

	watch(
		() => savedFeature.value,
		(newSavedFeature) => {
			stopWatchingCurrentLocation();

			if (currentMode.capabilities.canLoadMultiFeatures) {
				multiFeatureLayer.updateStyleVariables({
					[SAVED_ID_PROPERTY]: (newSavedFeature?.get(FEATURE_ID_PROPERTY) as string) ?? '',
				});
			}
		}
	);

	watch(
		() => userCurrentLocation.value,
		(newLocation) => {
			userCurrentLocationFeature.value = undefined;
			currentLocationSource.clear(true);
			if (!newLocation) {
				return;
			}

			const parsedCoords = fromLonLat([newLocation.longitude, newLocation.latitude]);
			userCurrentLocationFeature.value = new Feature({ geometry: new Point(parsedCoords) });
			currentLocationSource.addFeature(userCurrentLocationFeature.value);
			mapInstance
				?.getView()
				.animate({ center: parsedCoords, zoom: MAX_ZOOM, duration: ANIMATION_TIME });
		}
	);

	return {
		currentState,
		initMap,
		teardownMap,
		updateFeatureCollection,
		errorMessage,
		setupMapInteractions,

		canFitToAllFeatures: () => !featuresSource.isEmpty(),
		fitToAllFeatures,
		watchCurrentLocation,
		stopWatchingCurrentLocation,
		canSaveCurrentLocation: () =>
			currentMode.capabilities.canSaveCurrentLocation && !!userCurrentLocationFeature.value,
		canRemoveCurrentLocation: () =>
			currentMode.capabilities.canRemoveCurrentLocation && !!savedFeature.value,

		savedFeature,
		discardSavedFeature: () => {
			if (currentMode.capabilities.canLoadMultiFeatures) {
				saveFeature(undefined);
				return;
			}
			emptyMap();
		},
		saveFeature: () => {
			if (currentMode.capabilities.canSaveCurrentLocation && userCurrentLocation.value) {
				const { longitude, latitude } = userCurrentLocation.value;
				const feature = loadSingleFeature(longitude, latitude, {
					[ODK_VALUE_PROPERTY]: formatODKValue(longitude, latitude),
				});
				saveFeature(feature);
				return;
			}

			saveFeature(selectedFeature.value);
		},
		setSavedByValueProp,

		selectedFeatureProperties,
		selectSavedFeature: () => selectFeature(savedFeature.value),
		unselectFeature: () => selectFeature(undefined),
		isSelectedFeatureSaved,

		canViewProperties: () => currentMode.capabilities.canViewProperties,
		shouldShowMapOverlay: () => {
			return (
				currentMode.capabilities.canShowMapOverlay &&
				!savedFeature.value &&
				currentState.value === STATES.READY &&
				!userCurrentLocationFeature.value
			);
		},
	};
}
