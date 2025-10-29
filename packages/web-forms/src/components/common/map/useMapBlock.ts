import { getModeConfig, type Mode } from '@/components/common/map/getModeConfig.ts';
import {
	getSavedStyles,
	getSelectedStyles,
	getUnselectedStyles,
} from '@/components/common/map/map-styles.ts';
import {
	useMapInteractions,
	type UseMapInteractionsReturn,
} from '@/components/common/map/useMapInteractions.ts';
import {
	useMapViewControls,
	type UseMapViewControlsReturn,
} from '@/components/common/map/useMapViewControls.ts';
import type { FeatureCollection, Feature as GeoJsonFeature, GeoJsonProperties } from 'geojson';
import { Map, View } from 'ol';
import { Attribution, Zoom } from 'ol/control';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import { Point } from 'ol/geom';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import WebGLVectorLayer from 'ol/layer/WebGLVector';
import { fromLonLat, toLonLat } from 'ol/proj';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import { computed, shallowRef, watch } from 'vue';
import { get as getProjection } from 'ol/proj';

export const STATES = {
	LOADING: 'loading',
	READY: 'ready',
	ERROR: 'error',
	CAPTURING: 'capturing',
} as const;

const DEFAULT_GEOJSON_PROJECTION = 'EPSG:4326';
const DEFAULT_VIEW_PROJECTION = 'EPSG:3857';
const DEFAULT_VIEW_CENTER = [0, 0];
const MIN_ZOOM = 2;
const ANIMATION_TIME = 1000;
const FEATURE_ID_PROPERTY = 'odk_feature_id';
const ODK_VALUE_PROPERTY = 'odk_value';
const SAVED_ID_PROPERTY = 'savedId';
const SELECTED_ID_PROPERTY = 'selectedId';

export function useMapBlock(mode: Mode, onFeaturePlacement: () => void) {
	let mapInstance: Map | undefined;
	let mapInteractions: UseMapInteractionsReturn | undefined;
	let mapViewControls: UseMapViewControlsReturn | undefined;

	const currentMode = getModeConfig(mode);
	const currentState = shallowRef<(typeof STATES)[keyof typeof STATES]>(STATES.LOADING);
	const errorMessage = shallowRef<{ title: string; message: string } | undefined>();

	const savedFeature = shallowRef<Feature | undefined>();
	const selectedFeature = shallowRef<Feature | undefined>();
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

	const initMap = (
		mapContainer: HTMLElement,
		geoJSON: FeatureCollection,
		savedFeatureValue: GeoJsonFeature | undefined
	): void => {
		if (currentMode.capabilities.canLoadMultiFeatures && !isWebGLAvailable()) {
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
			layers: [new TileLayer({ source: new OSM() })],
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

		mapInteractions = useMapInteractions(mapInstance);
		mapViewControls = useMapViewControls(mapInstance);
		setupMode(geoJSON, savedFeatureValue);
		mapInteractions.setupMapVisibilityObserver(
			mapContainer,
			mapViewControls.stopWatchingCurrentLocation
		);
		currentState.value = STATES.READY;
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
			updateSavedFeature(feature);
		}
	};

	const setupMapInteractions = (isReadOnly: boolean) => {
		if (!mapInstance || !mapInteractions) {
			return;
		}

		mapInteractions.removeMapInteractions();

		if (isReadOnly) {
			return;
		}

		if (currentMode.interactions.select) {
			mapInteractions.toggleSelectEvent(true, selectFeature);
		}

		if (currentMode.interactions.drag) {
			mapInteractions.setupFeatureDrag(singleFeatureLayer, handleFeaturePlacement);
		}

		if (currentMode.interactions.longPress) {
			mapInteractions.setupLongPressPoint(featuresSource, handleFeaturePlacement);
		}
	};

	const handleFeaturePlacement = (feature: Feature) => {
		const geometry = (feature as Feature<Point>).getGeometry();
		if (!geometry) {
			return;
		}

		const [longitude, latitude] = toLonLat(geometry.getCoordinates());
		feature.set(ODK_VALUE_PROPERTY, formatODKValue(longitude, latitude));
		updateSavedFeature(feature);

		if (onFeaturePlacement) {
			onFeaturePlacement();
		}
	};

	const emptyMap = () => {
		selectFeature(undefined);
		updateSavedFeature(undefined);
		featuresSource.clear(true);
	};

	const updateFeatureCollection = (
		newCollection: FeatureCollection,
		savedFeatureValue: GeoJsonFeature | undefined
	) => {
		loadFeatureCollection(newCollection);
		setSavedByValueProp(savedFeatureValue);
	};

	const loadSingleFeature = (
		longitude: number,
		latitude: number,
		properties: GeoJsonProperties
	): Feature | undefined => {
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

		mapViewControls?.fitToAllFeatures(featuresSource);

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

		mapViewControls?.fitToAllFeatures(featuresSource);
	};

	const selectFeature = (feature?: Feature) => (selectedFeature.value = feature);

	const saveFeature = () => {
		if (
			currentMode.capabilities.canSaveCurrentLocation &&
			mapViewControls?.userCurrentLocation.value
		) {
			const { longitude, latitude } = mapViewControls.userCurrentLocation.value;
			const feature = loadSingleFeature(longitude, latitude, {
				[ODK_VALUE_PROPERTY]: formatODKValue(longitude, latitude),
			});
			updateSavedFeature(feature);
			return;
		}

		updateSavedFeature(selectedFeature.value);
	};

	const updateSavedFeature = (feature?: Feature) => (savedFeature.value = feature);

	const discardSavedFeature = () => {
		if (currentMode.capabilities.canLoadMultiFeatures) {
			updateSavedFeature(undefined);
			return;
		}
		emptyMap();
	};

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

		updateSavedFeature(featureToSave);
		mapViewControls?.centerFeatureLocation(featureToSave);
	};

	const isSelectedFeatureSaved = (): boolean => {
		const savedId = savedFeature.value?.get(FEATURE_ID_PROPERTY) as string;
		const selectedId = selectedFeature.value?.get(FEATURE_ID_PROPERTY) as string;
		return savedId?.length > 0 && savedId === selectedId;
	};

	const formatODKValue = (longitude: number, latitude: number) => `${latitude} ${longitude}`;

	const teardownMap = () => {
		mapViewControls?.stopWatchingCurrentLocation();
		mapInteractions?.teardownMap();
	};

	const shouldShowMapOverlay = () => {
		return (
			currentMode.capabilities.canShowMapOverlay &&
			!savedFeature.value &&
			currentState.value === STATES.READY &&
			!mapViewControls?.userCurrentLocationFeature.value
		);
	};

	const canSaveCurrentLocation = () => {
		return (
			currentMode.capabilities.canSaveCurrentLocation &&
			!!mapViewControls?.userCurrentLocationFeature.value
		);
	};

	const canRemoveCurrentLocation = () => {
		return currentMode.capabilities.canRemoveCurrentLocation && !!savedFeature.value;
	};

	const watchCurrentLocation = () => {
		currentState.value = STATES.CAPTURING;
		mapViewControls?.watchCurrentLocation(
			() => (currentState.value = STATES.READY),
			() => {
				currentState.value = STATES.ERROR;
				// TODO: translations
				errorMessage.value = {
					title: 'Cannot access location',
					message:
						'Grant location permission in the browser settings and make sure location is turned on.',
				};
			}
		);
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
				mapViewControls?.centerFeatureLocation(newSelectedFeature);
			}
		}
	);

	watch(
		() => savedFeature.value,
		(newSavedFeature) => {
			mapViewControls?.stopWatchingCurrentLocation();

			if (currentMode.capabilities.canLoadMultiFeatures) {
				multiFeatureLayer.updateStyleVariables({
					[SAVED_ID_PROPERTY]: (newSavedFeature?.get(FEATURE_ID_PROPERTY) as string) ?? '',
				});
			}
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
		fitToAllFeatures: () => mapViewControls?.fitToAllFeatures(featuresSource),
		watchCurrentLocation,
		stopWatchingCurrentLocation: () => mapViewControls?.stopWatchingCurrentLocation(),
		canSaveCurrentLocation,
		canRemoveCurrentLocation,

		savedFeature,
		discardSavedFeature,
		saveFeature,
		setSavedByValueProp,

		selectedFeatureProperties,
		selectSavedFeature: () => selectFeature(savedFeature.value),
		unselectFeature: () => selectFeature(undefined),
		isSelectedFeatureSaved,

		canViewProperties: () => currentMode.capabilities.canViewProperties,
		shouldShowMapOverlay,
	};
}
