import type { Coordinate } from 'ol/coordinate';
import type Feature from 'ol/Feature';
import type { LineString, Point, Polygon } from 'ol/geom';
import { toLonLat } from 'ol/proj';

export const formatODKValue = (feature: Feature): string => {
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

export const isWebGLAvailable = () => {
	try {
		const canvas = document.createElement('canvas');
		return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
	} catch {
		return false;
	}
};
