import { Map } from 'ol';
import { getCenter } from 'ol/extent';
import Feature from 'ol/Feature';
import { Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { Icon, Style } from 'ol/style';
import { type ShallowRef, shallowRef, watch } from 'vue';
import locationIcon from '@/assets/images/location-icon.svg';

type LocationWatchID = ReturnType<typeof navigator.geolocation.watchPosition>;

interface BrowserLocation
	extends Pick<GeolocationCoordinates, 'accuracy' | 'altitude' | 'latitude' | 'longitude'> {}

export interface UseMapViewControlsReturn {
	userCurrentLocation: ShallowRef<BrowserLocation | undefined>;
	userCurrentLocationFeature: ShallowRef<Feature<Point> | undefined>;
	centerFeatureLocation: (feature: Feature) => void;
	fitToAllFeatures: (featureSource: VectorSource) => void;
	stopWatchingCurrentLocation: () => void;
	watchCurrentLocation: (onSuccess: () => void, onError: () => void) => void;
}

const MAX_ZOOM = 19;
const GEOLOCATION_TIMEOUT_MS = 30 * 1000; // Field environments need more time and reduces false “no signal” warnings.
const ANIMATION_TIME = 1000;
const SMALL_DEVICE_WIDTH = 576;

export function useMapViewControls(mapInstance: Map): UseMapViewControlsReturn {
	const watchLocation = shallowRef<LocationWatchID | undefined>();
	const userCurrentLocation = shallowRef<BrowserLocation | undefined>();
	const userCurrentLocationFeature = shallowRef<Feature<Point> | undefined>();

	const currentLocationSource = new VectorSource();
	const currentLocationLayer = new VectorLayer({
		source: currentLocationSource,
		style: new Style({ image: new Icon({ src: locationIcon }) }),
	});
	mapInstance.addLayer(currentLocationLayer);

	const fitToAllFeatures = (featuresSource: VectorSource): void => {
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

	const watchCurrentLocation = (onSuccess: () => void, onError: () => void): void => {
		if (watchLocation.value) {
			if (userCurrentLocationFeature.value) {
				mapInstance?.getView().animate({
					center: userCurrentLocationFeature.value?.getGeometry()?.getCoordinates(),
					zoom: MAX_ZOOM,
					duration: ANIMATION_TIME,
				});
				onSuccess();
			}

			return;
		}

		const handleSuccess = (position: GeolocationPosition) => {
			const { latitude, longitude, altitude, accuracy } = position.coords;
			userCurrentLocation.value = { latitude, longitude, altitude, accuracy };
			onSuccess();
		};

		const handleError = () => {
			currentLocationSource.clear(true);
			onError();
		};

		if (!navigator.geolocation) {
			handleError();
		}

		const options = { enableHighAccuracy: true, timeout: GEOLOCATION_TIMEOUT_MS };
		watchLocation.value = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
	};

	const stopWatchingCurrentLocation = () => {
		currentLocationSource.clear();
		userCurrentLocation.value = undefined;

		if (watchLocation.value) {
			navigator.geolocation.clearWatch(watchLocation.value);
			watchLocation.value = undefined;
		}
	};

	const centerFeatureLocation = (feature: Feature): void => {
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
		userCurrentLocation,
		userCurrentLocationFeature,
		centerFeatureLocation,
		fitToAllFeatures,
		stopWatchingCurrentLocation,
		watchCurrentLocation,
	};
}
