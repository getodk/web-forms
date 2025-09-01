import { Map, View } from 'ol';
import { Zoom } from 'ol/control';
import type { Coordinate } from 'ol/coordinate';
import { getCenter } from 'ol/extent';
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

export interface MapConfig {
	viewCoordinates: Coordinate;
	zoom?: number; // See DEFAULT_ZOOM
}

export type GeometryType = LineString | Point | Polygon;

// TODO: This type will come from xforms-engine
export interface GeoJSONInput {
	type: string;
	features?: Array<{
		type: string;
		geometry: {
			type: string;
			coordinates: unknown;
		};
		properties?: Record<string, unknown>;
	}>;
}

export const STATES = {
	LOADING: 'loading',
	READY: 'ready',
	READ_ONLY: 'read_only',
	ERROR: 'error',
} as const;

const GEOLOCATION_TIMEOUT_MS = 10 * 1000;
const DEFAULT_ZOOM = 10;
const ANIMATION_TIME = 1000;
const FEATURE_ID_PROPERTY = '__id';

export function useMapBlock(config: MapConfig) {
	const zoom = config.zoom ?? DEFAULT_ZOOM;

	const currentState = shallowRef<(typeof STATES)[keyof typeof STATES]>(STATES.LOADING);
	const errorMessage = shallowRef<string | undefined>();
	const mapInstance = ref<Map | undefined>();
	const vectorLayer = ref<WebGLVectorLayer | undefined>(); // ToDo: better name - contains all the features
	const selectedFeature = ref<Feature<GeometryType> | undefined>();
	const selectedFeatureProperties = computed<Record<string, unknown>>(() => {
		const { geometry, __id, ...props } = selectedFeature.value?.getProperties() ?? {};
		return props;
	});

	const initializeMap = (mapContainer: HTMLElement): void => {
		mapInstance.value = new Map({
			target: mapContainer,
			layers: [new TileLayer({ source: new OSM() })],
			view: new View({
				center: fromLonLat(config.viewCoordinates),
				zoom: zoom,
			}),
			controls: [new Zoom()],
		});
	};

	const centerCurrentLocation = (): void => {
		if (!navigator.geolocation) {
			currentState.value = STATES.ERROR;
			errorMessage.value = 'Geolocation Error: Geolocation is not supported by this browser.';
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				currentState.value = STATES.READY;
				const coords = fromLonLat([position.coords.longitude, position.coords.latitude]);
				mapInstance.value
					?.getView()
					.animate({ center: coords, zoom: zoom, duration: ANIMATION_TIME });
			},
			(error) => {
				currentState.value = STATES.ERROR;
				errorMessage.value = `Geolocation Error: ${error.message}`;
			},
			{ enableHighAccuracy: true, timeout: GEOLOCATION_TIMEOUT_MS }
		);
	};

	const centerFeatureLocation = (feature: Feature<GeometryType>): void => {
		const geometry = feature.getGeometry();
		if (geometry == null) {
			return;
		}

		mapInstance.value?.getView().animate({
			center: getCenter(geometry.getExtent()),
			zoom: zoom,
			duration: ANIMATION_TIME,
		});
	};

	const loadGeometries = (geoJSON: GeoJSONInput): void => {
		if (mapInstance.value == null) {
			return;
		}

		currentState.value = STATES.LOADING;
		selectedFeature.value = undefined;
		if (vectorLayer.value != null) {
			mapInstance.value.removeLayer(vectorLayer.value);
			vectorLayer.value.dispose();
			vectorLayer.value = undefined;
		}

		const features = new GeoJSON().readFeatures(geoJSON, {
			dataProjection: 'EPSG:4326', // ToDo: Typical for GeoJSON ?
			featureProjection: mapInstance.value.getView().getProjection(), // ToDo: OSM uses EPSG:3857 ?
		});

		features.forEach((feature) => {
			if (feature.get(FEATURE_ID_PROPERTY) == null) {
				feature.set(FEATURE_ID_PROPERTY, crypto.randomUUID());
			}
		});

		const style = {
			'circle-radius': 7, // For points: circle style
			'circle-fill-color': 'fuchsia',
			'stroke-color': 'fuchsia', // For lines/polygons: stroke
			'stroke-width': 3,
			'fill-color': ['color', 191, 0, 255, 0.5], // For polygons: semi-transparent fill
			// Example dynamic: 'circle-radius': ['interpolate', ['linear'], ['get', 'value'], 0, 3, 100, 10],
		};

		vectorLayer.value = new WebGLVectorLayer({ source: new VectorSource({ features }), style });
		mapInstance.value.addLayer(vectorLayer.value);
		mapInstance.value.on('singleclick', (event) => selectFeature(event.pixel));

		currentState.value = STATES.READY;
	};

	const selectFeature = (position: Pixel): void => {
		const hitFeatures = mapInstance.value?.getFeaturesAtPixel(position, {
			hitTolerance: 5,
			layerFilter: (layer) => layer === vectorLayer.value,
		});

		selectedFeature.value = hitFeatures?.length
			? (hitFeatures[0] as Feature<GeometryType>)
			: undefined;

		vectorLayer.value?.updateStyleVariables({
			selectedId: (selectedFeature.value?.get(FEATURE_ID_PROPERTY) as string) ?? null,
		});
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
		selectedFeatureProperties,
		errorMessage,
		initializeMap,
		centerFeatureLocation,
		centerCurrentLocation,
		loadGeometries,
	};
}
