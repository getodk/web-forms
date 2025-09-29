import {
	getSavedStyles,
	getSelectedStyles,
	getUnselectedStyles,
} from '@/components/common/map/map-styles.ts';
import type { FeatureCollection } from 'geojson';
import { Map, View } from 'ol';
import { Zoom } from 'ol/control';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import { LineString, Point, Polygon } from 'ol/geom';
import TileLayer from 'ol/layer/Tile';
import WebGLVectorLayer from 'ol/layer/WebGLVector';
import type { Pixel } from 'ol/pixel';
import { fromLonLat } from 'ol/proj';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import { computed, ref, shallowRef, watch } from 'vue';

type GeometryType = LineString | Point | Polygon;
interface FeatureProperties {
	reservedProps: Record<string, string>;
	orderedProps: Array<[string, string]>;
}

const STATES = {
	LOADING: 'loading',
	READY: 'ready',
	ERROR: 'error',
} as const;

const DEFAULT_GEOJSON_PROJECTION = 'EPSG:4326';
const DEFAULT_VIEW_CENTER = [0, 0];
const MAX_ZOOM = 16;
const MIN_ZOOM = 2;
const GEOLOCATION_TIMEOUT_MS = 10 * 1000;
const ANIMATION_TIME = 1000;
const SMALL_DEVICE_WIDTH = 576;
const MAP_HIT_TOLERANCE = 5;
const FEATURE_ID_PROPERTY = 'feature_id';
const SAVED_ID_PROPERTY = 'savedId';
const SELECTED_ID_PROPERTY = 'selectedId';

export function useMapBlock() {
	const currentState = shallowRef<(typeof STATES)[keyof typeof STATES]>(STATES.LOADING);
	const errorMessage = shallowRef<{ title: string; message: string } | undefined>();
	const mapInstance = ref<Map | undefined>();
	const savedFeature = ref<Feature<GeometryType> | undefined>();
	const selectedFeature = ref<Feature<GeometryType> | undefined>();
	const selectedFeatureProperties = computed<FeatureProperties | undefined>(() => {
		return selectedFeature.value?.getProperties() as FeatureProperties | undefined;
	});

	const featuresVectorLayer = new WebGLVectorLayer({
		source: new VectorSource(),
		style: [
			...getUnselectedStyles(FEATURE_ID_PROPERTY, SELECTED_ID_PROPERTY, SAVED_ID_PROPERTY),
			...getSelectedStyles(FEATURE_ID_PROPERTY, SELECTED_ID_PROPERTY, SAVED_ID_PROPERTY),
			...getSavedStyles(FEATURE_ID_PROPERTY, SAVED_ID_PROPERTY),
		],
		variables: { [SAVED_ID_PROPERTY]: '', [SELECTED_ID_PROPERTY]: '' },
	});

	const initializeMap = (mapContainer: HTMLElement, geoJSON: FeatureCollection): void => {
		if (mapInstance.value) {
			return;
		}

		mapInstance.value = new Map({
			target: mapContainer,
			layers: [new TileLayer({ source: new OSM() }), featuresVectorLayer],
			view: new View({ center: DEFAULT_VIEW_CENTER, zoom: MIN_ZOOM }),
			controls: [new Zoom()],
		});

		mapInstance.value.on('singleclick', (event) => selectFeatureByPosition(event.pixel));
		currentState.value = STATES.READY;
		loadGeometries(geoJSON);
	};

	const fitToAllFeatures = (): void => {
		const source = featuresVectorLayer.getSource() as VectorSource | undefined;
		const extent = source?.getExtent();
		if (extent) {
			mapInstance.value?.getView().fit(extent, {
				padding: [50, 50, 50, 50],
				duration: ANIMATION_TIME,
				maxZoom: MAX_ZOOM,
			});
		}
	};

	const centerCurrentLocation = (): void => {
		// TODO: translations
		const friendlyError = {
			title: 'Cannot access location',
			message:
				'Grant location permission in the browser settings and make sure location is turned on.',
		};

		if (!navigator.geolocation) {
			currentState.value = STATES.ERROR;
			errorMessage.value = friendlyError;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				const coords = fromLonLat([position.coords.longitude, position.coords.latitude]);
				mapInstance.value
					?.getView()
					.animate({ center: coords, zoom: MAX_ZOOM, duration: ANIMATION_TIME });
				currentState.value = STATES.READY;
			},
			() => {
				currentState.value = STATES.ERROR;
				errorMessage.value = friendlyError;
			},
			{ enableHighAccuracy: true, timeout: GEOLOCATION_TIMEOUT_MS }
		);
	};

	const centerFeatureLocation = (feature: Feature<GeometryType>): void => {
		const geometry = feature.getGeometry();
		const size = mapInstance.value?.getSize();
		const view = mapInstance.value?.getView();

		if (geometry == null || !size?.length || view == null) {
			return;
		}

		const width = size[0];
		const height = size[1];
		let pixelOffsetY = 0;
		let pixelOffsetX = -50;
		if (width < SMALL_DEVICE_WIDTH) {
			pixelOffsetY = 130;
			pixelOffsetX = 0;
		}

		view.centerOn(geometry.getExtent(), size, [
			width / 2 - pixelOffsetX,
			height / 2 - pixelOffsetY,
		]);
	};

	const loadGeometries = (geoJSON: FeatureCollection): void => {
		const source = featuresVectorLayer.getSource();
		if (mapInstance.value == null || source == null) {
			return;
		}

		currentState.value = STATES.LOADING;
		unselectFeature();
		discardSavedFeature();
		source.clear();

		if (!geoJSON.features.length) {
			mapInstance.value?.getView().animate({
				center: DEFAULT_VIEW_CENTER,
				zoom: MIN_ZOOM,
				duration: ANIMATION_TIME,
			});
			currentState.value = STATES.READY;
			return;
		}

		const features = new GeoJSON().readFeatures(geoJSON, {
			dataProjection: DEFAULT_GEOJSON_PROJECTION,
			featureProjection: mapInstance.value.getView().getProjection(),
		});

		features.forEach((feature) => {
			if (feature.get(FEATURE_ID_PROPERTY) == null) {
				feature.set(FEATURE_ID_PROPERTY, crypto.randomUUID());
			}
		});
		source.addFeatures(features);
		currentState.value = STATES.READY;

		fitToAllFeatures();
	};

	const selectFeatureByPosition = (position: Pixel): void => {
		const hitFeatures = mapInstance.value?.getFeaturesAtPixel(position, {
			hitTolerance: MAP_HIT_TOLERANCE,
			layerFilter: (layer) => layer instanceof WebGLVectorLayer,
		});

		const featureToSelect = hitFeatures?.length
			? (hitFeatures[0] as Feature<GeometryType>)
			: undefined;

		selectFeature(featureToSelect);
	};

	const selectFeature = (feature: Feature<GeometryType> | undefined): void => {
		selectedFeature.value = feature;

		featuresVectorLayer.updateStyleVariables({
			[SELECTED_ID_PROPERTY]: (selectedFeature.value?.get(FEATURE_ID_PROPERTY) as string) ?? '',
		});

		if (selectedFeature.value != null) {
			centerFeatureLocation(selectedFeature.value);
		}
	};

	const unselectFeature = (): void => {
		selectedFeature.value = undefined;
		featuresVectorLayer.updateStyleVariables({ [SELECTED_ID_PROPERTY]: '' });
	};

	const saveFeature = (feature: Feature<GeometryType> | undefined): void => {
		savedFeature.value = feature;
		const savedFeatureId = (savedFeature.value?.get(FEATURE_ID_PROPERTY) as string) ?? '';
		featuresVectorLayer.updateStyleVariables({
			[SAVED_ID_PROPERTY]: savedFeatureId,
		});
	};

	const discardSavedFeature = (): void => {
		savedFeature.value = undefined;
		featuresVectorLayer.updateStyleVariables({ [SAVED_ID_PROPERTY]: '' });
	};

	const setSavedByValueProp = (value: string | undefined): void => {
		if (!value?.length) {
			return;
		}

		const features = featuresVectorLayer.getSource()?.getFeatures();
		const featureToSave = features?.find((feature) => {
			const { reservedProps } = feature.getProperties() as FeatureProperties;
			return reservedProps.value === value;
		}) as Feature<GeometryType>;

		if (!featureToSave) {
			return;
		}

		saveFeature(featureToSave);
		centerFeatureLocation(featureToSave);
	};

	const isSelectedFeatureSaved = (): boolean => {
		const savedId = savedFeature.value?.get(FEATURE_ID_PROPERTY) as string;
		const selectedId = selectedFeature.value?.get(FEATURE_ID_PROPERTY) as string;
		return savedId?.length > 0 && savedId === selectedId;
	};

	watch(
		() => currentState.value,
		() => {
			if (currentState.value !== STATES.ERROR) {
				errorMessage.value = undefined;
			}
		},
		{ immediate: true }
	);

	return {
		initializeMap,
		loadGeometries,
		errorMessage,

		centerCurrentLocation,
		centerFeatureLocation,

		savedFeature,
		discardSavedFeature,
		saveFeature: () => saveFeature(selectedFeature.value),
		setSavedByValueProp,

		selectedFeatureProperties,
		selectFeature,
		isSelectedFeatureSaved,
		unselectFeature,
	};
}
