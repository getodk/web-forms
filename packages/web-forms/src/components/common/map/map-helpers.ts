import { getFlatCoordinates } from '@/components/common/map/vertex-geometry.ts';
import type { Coordinate } from 'ol/coordinate';
import type Feature from 'ol/Feature';
import type { LineString, Point, Polygon } from 'ol/geom';
import { toLonLat } from 'ol/proj';

const resolveAltitudeAndAccuracy = (
	altitude: number | null | undefined,
	accuracy: number | null | undefined
) => {
	const arr = [];
	if (accuracy != null) {
		arr.push(altitude ?? 0, accuracy);
	} else if (altitude != null) {
		arr.push(altitude);
	}
	return arr;
};

// Longitude is first for GeoJSON and latitude is second.
export const toGeoJsonCoordinateArray = (
	longitude: number,
	latitude: number,
	altitude: number | null | undefined,
	accuracy: number | null | undefined
): number[] => {
	const coords = [longitude, latitude];
	coords.push(...resolveAltitudeAndAccuracy(altitude, accuracy));
	return coords;
};

// Latitude is first for ODK and longitude is second.
export const toODKCoordinateArray = (
	longitude: number,
	latitude: number,
	altitude: number | null | undefined,
	accuracy: number | null | undefined
): number[] => {
	const coords = [latitude, longitude];
	coords.push(...resolveAltitudeAndAccuracy(altitude, accuracy));
	return coords;
};

export const formatODKValue = (feature: Feature): string => {
	const geometry = feature.getGeometry();
	if (!geometry) {
		return '';
	}

	const formatCoords = (coords: Coordinate) => {
		const parsedCoords = toLonLat(coords) as [number, number, number?, number?];
		return toODKCoordinateArray(...parsedCoords).join(' ');
	};

	const featureType = geometry.getType();
	if (featureType === 'Point') {
		const coordinates = (geometry as Point).getCoordinates();
		return coordinates?.length ? formatCoords(coordinates) : '';
	}

	const coordinates: Coordinate[] = getFlatCoordinates(geometry as LineString | Polygon);
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
