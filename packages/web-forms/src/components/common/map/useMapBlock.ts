import { getModeConfig, type Mode, MODES } from '@/components/common/map/getModeConfig.ts';
import {
	getDrawStyles,
	getSavedStyles,
	getSelectedStyles,
	getUnselectedStyles,
} from '@/components/common/map/map-styles.ts';
import {
	FEATURE_ID_PROPERTY,
	SAVED_ID_PROPERTY,
	SELECTED_ID_PROPERTY,
	SELECTED_VERTEX_INDEX_PROPERTY,
	useMapFeatures,
	type UseMapFeatures,
} from '@/components/common/map/useMapFeatures.ts';
import {
	type DrawFeatureType,
	useMapInteractions,
	type UseMapInteractions,
} from '@/components/common/map/useMapInteractions.ts';
import {
	DEFAULT_VIEW_CENTER,
	MIN_ZOOM,
	useMapViewControls,
	type UseMapViewControls,
} from '@/components/common/map/useMapViewControls.ts';
import type { FeatureCollection, Feature as GeoJsonFeature } from 'geojson';
import { Map, View } from 'ol';
import { Attribution, Zoom } from 'ol/control';
import type { Coordinate } from 'ol/coordinate';
import Feature from 'ol/Feature';
import { LineString, Point, Polygon } from 'ol/geom';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import WebGLVectorLayer from 'ol/layer/WebGLVector';
import { toLonLat, fromLonLat } from 'ol/proj';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import { shallowRef, watch } from 'vue';
import { get as getProjection } from 'ol/proj';

export const STATES = {
	LOADING: 'loading',
	READY: 'ready',
	ERROR: 'error',
	CAPTURING: 'capturing',
} as const;

const DEFAULT_VIEW_PROJECTION = 'EPSG:3857';

export const ODK_VALUE_PROPERTY = 'odk_value';

interface MapBlockConfig {
	mode: Mode;
	drawFeatureType?: DrawFeatureType;
}

interface MapBlockEvents {
	onFeaturePlacement: () => void;
}

export function useMapBlock(config: MapBlockConfig, events: MapBlockEvents) {
	let mapInstance: Map | undefined;
	let mapInteractions: UseMapInteractions | undefined;
	let mapViewControls: UseMapViewControls | undefined;
	let mapFeatures: UseMapFeatures | undefined;

	const currentMode = getModeConfig(config.mode);
	const currentState = shallowRef<(typeof STATES)[keyof typeof STATES]>(STATES.LOADING);
	const errorMessage = shallowRef<{ title: string; message: string } | undefined>();

	const featuresSource = new VectorSource();
	const singleFeatureLayer = new VectorLayer({
		source: featuresSource,
		style:
			config.mode === MODES.DRAW
				? getDrawStyles(SELECTED_VERTEX_INDEX_PROPERTY)
				: getSavedStyles(FEATURE_ID_PROPERTY, SAVED_ID_PROPERTY),
		updateWhileAnimating: true,
	});
	const multiFeatureLayer = new WebGLVectorLayer({
		source: featuresSource,
		style: [
			...getUnselectedStyles(FEATURE_ID_PROPERTY, SELECTED_ID_PROPERTY, SAVED_ID_PROPERTY),
			...getSelectedStyles(FEATURE_ID_PROPERTY, SELECTED_ID_PROPERTY, SAVED_ID_PROPERTY),
			...getSavedStyles(FEATURE_ID_PROPERTY, SAVED_ID_PROPERTY),
		],
		variables: { [SAVED_ID_PROPERTY]: '', [SELECTED_ID_PROPERTY]: '' },
	});

	const initMap = (
		mapContainer: HTMLElement,
		geoJSON: FeatureCollection,
		savedFeatureValue: GeoJsonFeature | undefined
	): void => {
		if (mapInstance) {
			return;
		}

		if (currentMode.capabilities.canLoadMultiFeatures && !isWebGLAvailable()) {
			currentState.value = STATES.ERROR;
			errorMessage.value = {
				title: 'Graphics issue detected',
				message: 'Your browser cannot display the map now. Enable graphics acceleration settings.',
			};
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

		mapInteractions = useMapInteractions(
			mapInstance,
			currentMode.capabilities,
			config.drawFeatureType
		);
		mapViewControls = useMapViewControls(mapInstance);
		mapFeatures = useMapFeatures(mapInstance, mapViewControls, multiFeatureLayer);

		initLayer(geoJSON, savedFeatureValue);
		mapInteractions.setupMapVisibilityObserver(mapContainer, () =>
			mapViewControls?.stopWatchingCurrentLocation()
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

	const initLayer = (geoJSON: FeatureCollection, savedFeatureValue: GeoJsonFeature | undefined) => {
		if (!mapInstance) {
			return;
		}

		if (currentMode.capabilities.canLoadMultiFeatures) {
			mapInstance.addLayer(multiFeatureLayer);
			updateFeatureCollection(geoJSON, savedFeatureValue);
			return;
		}

		mapInstance.addLayer(singleFeatureLayer);
		if (!savedFeatureValue) {
			return;
		}

		const feature = mapFeatures?.createFeature(savedFeatureValue);
		loadAndSaveSingleFeature(feature);
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
			mapInteractions.toggleSelectEvent(true, (feature, vertexIndex) => {
				mapFeatures?.selectFeature(feature, vertexIndex);
			});
		}

		if (currentMode.interactions.drag) {
			mapInteractions.setupFeatureDrag(singleFeatureLayer, (feature) =>
				handlePointPlacement(feature)
			);
		}

		if (currentMode.interactions.longPress) {
			mapInteractions.setupLongPressPoint(featuresSource, (feature) =>
				handlePointPlacement(feature)
			);
		}
	};

	const handlePointPlacement = (feature: Feature) => {
		feature.set(ODK_VALUE_PROPERTY, formatODKValue(feature));
		mapFeatures?.saveFeature(feature);

		if (events.onFeaturePlacement) {
			events.onFeaturePlacement();
		}
	};

	const clearMap = () => {
		mapFeatures?.selectFeature(undefined);
		mapFeatures?.saveFeature(undefined);
		featuresSource.clear(true);
	};

	const updateFeatureCollection = (features: FeatureCollection, savedFeature?: GeoJsonFeature) => {
		loadFeatureCollection(features);
		mapFeatures?.findAndSaveFeature(featuresSource, savedFeature, true);
	};

	const loadAndSaveSingleFeature = (feature: Feature | undefined) => {
		if (!mapInstance || currentMode.capabilities.canLoadMultiFeatures || !feature) {
			return;
		}

		currentState.value = STATES.LOADING;
		mapFeatures?.loadAndSaveSingleFeature(featuresSource, feature);
		currentState.value = STATES.READY;
	};

	const loadFeatureCollection = (geoJSON: FeatureCollection): void => {
		if (!mapInstance || !currentMode.capabilities.canLoadMultiFeatures) {
			return;
		}

		currentState.value = STATES.LOADING;
		clearMap();

		if (geoJSON.features.length) {
			mapFeatures?.loadFeatureCollection(featuresSource, geoJSON);
		} else {
			mapViewControls?.centerFullWorldView();
		}

		currentState.value = STATES.READY;
	};

	const saveCurrentLocation = () => {
		const location = mapViewControls?.getUserCurrentLocation();
		if (!currentMode.capabilities.canSaveCurrentLocation || !location) {
			return;
		}

		const coords = [location.longitude, location.latitude];
		if (location.altitude != null) {
			coords.push(location.altitude);
		}

		// TODO: accuracy is not part of the GeoJSON coordinates spec but is used by ODK. Adding it as a property for now? ODK_ACCURACY_PROPERTY = 'odk_accuracy'
		const feature = new Feature({
			geometry: new Point(fromLonLat(coords)),
		});
		feature.set(ODK_VALUE_PROPERTY, formatODKValue(feature));
		loadAndSaveSingleFeature(feature);
	};

	const discardSavedFeature = () => {
		if (currentMode.capabilities.canLoadMultiFeatures) {
			mapFeatures?.saveFeature(undefined);
			return;
		}
		clearMap();
	};

	const formatODKValue = (feature: Feature): string => {
		const geometry = feature.getGeometry();
		if (!geometry) {
			return '';
		}

		// ToDo: should we use the accuracy property here?
		const formatCoords = (coords: Coordinate, accuracy?: number) => {
			const [longitude, latitude, altitude] = toLonLat(coords);
			return [latitude, longitude, altitude, accuracy].filter((item) => item != null).join(' ');
		};

		const featureType = geometry.getType();
		if (featureType === 'Point') {
			const coordinates = (geometry as Point).getCoordinates();
			return coordinates ? formatCoords(coordinates) : '';
		}

		let coordinates: Coordinate[] = [];
		if (featureType === 'LineString') {
			coordinates = (geometry as LineString).getCoordinates();
		}

		if (featureType === 'Polygon') {
			const rings: Coordinate[][] = (geometry as Polygon).getCoordinates();
			if (rings.length > 1) {
				// eslint-disable-next-line no-console -- createFeatureCollectionAndProps doesn't produce multiple rings, and this feature auto-completes the polygon, so it shouldn't happen.
				console.warn(
					'Shape has holes, which are not supported in ODK Geoshape; using exterior ring only.'
				);
			}
			coordinates = rings[0] ?? [];
		}

		return coordinates.map((coord) => formatCoords(coord)).join('; ');
	};

	const teardownMap = () => {
		mapViewControls?.stopWatchingCurrentLocation();
		mapInteractions?.teardownMap();
	};

	const shouldShowMapOverlay = () => {
		const hasNoRelevantFeature =
			!mapViewControls?.hasCurrentLocationFeature() && !mapFeatures?.getSavedFeature();

		if (currentState.value === STATES.ERROR) {
			return currentMode.capabilities.canShowMapOverlayOnError && hasNoRelevantFeature;
		}

		return (
			currentState.value === STATES.READY &&
			currentMode.capabilities.canShowMapOverlay &&
			hasNoRelevantFeature
		);
	};

	const canSaveCurrentLocation = () => {
		return (
			currentMode.capabilities.canSaveCurrentLocation &&
			!!mapViewControls?.hasCurrentLocationFeature()
		);
	};

	const canRemoveCurrentLocation = () => {
		return currentMode.capabilities.canRemoveCurrentLocation && !!mapFeatures?.getSavedFeature();
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

	return {
		currentState,
		errorMessage,
		initMap,
		teardownMap,
		updateFeatureCollection,
		setupMapInteractions,

		canFitToAllFeatures: () => !featuresSource.isEmpty(),
		fitToAllFeatures: () => mapViewControls?.fitToAllFeatures(featuresSource),
		watchCurrentLocation,
		canSaveCurrentLocation,
		canRemoveCurrentLocation,

		discardSavedFeature,
		saveSelectedFeature: () => mapFeatures?.saveSelectedFeature(),
		saveCurrentLocation,
		findAndSaveFeature: (feature: GeoJsonFeature) =>
			mapFeatures?.findAndSaveFeature(
				featuresSource,
				feature,
				currentMode.capabilities.canViewProperties
			),
		isFeatureSaved: () => !!mapFeatures?.getSavedFeature(),
		getSavedFeatureValue: (): string | undefined =>
			mapFeatures?.getSavedFeature()?.getProperties()?.[ODK_VALUE_PROPERTY] as string,
		isSavedFeatureSelected: () => !!mapFeatures?.isSavedFeatureSelected(),

		getSelectedFeatureProperties: () => mapFeatures?.getSelectedFeatureProperties(),
		selectSavedFeature: () => mapFeatures?.selectFeature(mapFeatures?.getSavedFeature()),
		unselectFeature: () => mapFeatures?.selectFeature(undefined),

		canLongPressAndDrag: () => currentMode.interactions.longPress && currentMode.interactions.drag,
		canViewProperties: () => currentMode.capabilities.canViewProperties,
		shouldShowMapOverlay,
	};
}
