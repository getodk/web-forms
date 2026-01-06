/**
 * IMPORTANT: OpenLayers is not statically imported here to enable bundling them into a separate chunk.
 * This prevents unnecessary bloat in the main application bundle, reducing initial load times and improving performance.
 *
 * This file is for GeoJSON logic, which should not use OpenLayers types directly.
 */
import type { SelectItem } from '@getodk/xforms-engine';
import type { Feature, FeatureCollection, Geometry, LineString, Point, Polygon } from 'geojson';

const PROPERTY_PREFIX = 'odk_'; // Avoids conflicts with OpenLayers (for example, geometry).

const RESERVED_MAP_PROPERTIES = [
	'itextId',
	'geometry',
	'marker-color',
	'marker-symbol',
	'stroke',
	'stroke-width',
	'fill',
	'__version',
	'__trunkVersion',
	'__branchId',
];

type Coordinates = [longitude: number, latitude: number];

// Longitude is first for GeoJSON and latitude is second.
export const toGeoJsonCoordinateArray = (
	longitude: number,
	latitude: number,
	altitude: number | null | undefined,
	accuracy: number | null | undefined
): number[] => {
	const coords = [];
	if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
		coords.push(longitude, latitude);

		if (Number.isFinite(accuracy)) {
			coords.push(Number.isFinite(altitude) ? altitude! : 0, accuracy!);
		} else if (Number.isFinite(altitude)) {
			coords.push(altitude!);
		}
	}

	return coords;
};

const getGeoJSONCoordinates = (geometry: string): [Coordinates, ...Coordinates[]] | undefined => {
	const coordinates: Coordinates[] = [];
	for (const coord of geometry.split(';')) {
		const [lat, lon, alt, acc] = coord.trim().split(/\s+/).map(Number);

		const isNullLocation = lat === 0 && lon === 0;
		const isValidLatitude = lat != null && !Number.isNaN(lat) && Math.abs(lat) <= 90;
		const isValidLongitude = lon != null && !Number.isNaN(lon) && Math.abs(lon) <= 180;
		const isAltitudeProvided = alt != null && !Number.isNaN(alt);
		const isAccuracyProvided = acc != null && !Number.isNaN(acc);

		if (isNullLocation || !isValidLatitude || !isValidLongitude) {
			// eslint-disable-next-line no-console -- Skip silently to match Collect behaviour.
			console.warn(`Invalid geo point coordinates: ${geometry}`);
			return;
		}

		const parsedCoords = toGeoJsonCoordinateArray(
			lon,
			lat,
			isAltitudeProvided ? alt : undefined,
			isAccuracyProvided ? acc : undefined
		) as Coordinates;
		coordinates.push(parsedCoords);
	}

	return coordinates.length ? (coordinates as [Coordinates, ...Coordinates[]]) : undefined;
};

const getGeoJSONGeometry = (coords: [Coordinates, ...Coordinates[]]): Geometry => {
	if (coords.length === 1) {
		return { type: 'Point', coordinates: coords[0] };
	}

	const [firstLongitude, firstLatitude] = coords[0];
	const [lastLongitude, lastLatitude] = coords[coords.length - 1]!; // ! because coords.length > 1

	if (firstLongitude === lastLongitude && firstLatitude === lastLatitude) {
		return { type: 'Polygon', coordinates: [coords] };
	}

	return { type: 'LineString', coordinates: coords };
};

export const createGeoJSONGeometry = (value: string): Geometry | undefined => {
	const coords = getGeoJSONCoordinates(value);
	if (!coords) {
		return;
	}
	return getGeoJSONGeometry(coords);
};

const normalizeODKFeature = (odkFeature: SelectItem | string) => {
	if (typeof odkFeature === 'string') {
		return {
			label: odkFeature,
			value: odkFeature,
			properties: [['geometry', odkFeature]],
		};
	}

	return {
		...odkFeature,
		label: odkFeature.label?.asString,
	};
};

export const createFeatureCollectionAndProps = (
	odkFeatures: readonly SelectItem[] | readonly string[] | undefined
) => {
	const orderedExtraPropsMap = new Map<string, Array<[key: string, value: string]>>();
	const features: Feature[] = [];

	odkFeatures?.forEach((odkFeature) => {
		const normalizedFeature = normalizeODKFeature(odkFeature);

		const orderedProps: Array<[string, string]> = [];
		const reservedProps: Record<string, string> = {
			[PROPERTY_PREFIX + 'label']: normalizedFeature.label,
			[PROPERTY_PREFIX + 'value']: normalizedFeature.value,
		};

		normalizedFeature.properties.forEach(([key = '', value = '']) => {
			if (RESERVED_MAP_PROPERTIES.includes(key)) {
				reservedProps[PROPERTY_PREFIX + key] = value.trim();
			} else {
				orderedProps.push([key, value.trim()]);
			}
		});

		if (orderedProps.length) {
			orderedExtraPropsMap.set(normalizedFeature.value, orderedProps);
		}

		const geometry = reservedProps[PROPERTY_PREFIX + 'geometry'];
		if (!geometry?.length) {
			// eslint-disable-next-line no-console -- Skip silently to match Collect behaviour.
			console.warn(`Missing or empty geometry for option: ${normalizedFeature.value}`);
			return;
		}

		const geoJSONCoords = getGeoJSONCoordinates(geometry);
		if (!geoJSONCoords) {
			// eslint-disable-next-line no-console -- Skip silently to match Collect behaviour.
			console.warn(`Missing geo points for option: ${normalizedFeature.value}`);
			return;
		}

		features.push({
			type: 'Feature',
			geometry: getGeoJSONGeometry(geoJSONCoords),
			properties: reservedProps,
		});
	});

	return {
		featureCollection: { type: 'FeatureCollection', features },
		orderedExtraPropsMap,
	};
};

export const parseSingleFeatureFromGeoJSON = (text: string): Geometry | undefined => {
	try {
		const geojson = JSON.parse(text) as FeatureCollection<LineString | Point | Polygon>;
		return geojson?.features?.[0]?.geometry as Geometry | undefined;
	} catch {
		// eslint-disable-next-line no-console -- Skip silently to match createFeatureCollectionAndProps
		console.warn(`Invalid GeoJSON: ${text}`);
		return;
	}
};

export const parseSingleFeatureFromCSV = (text: string): Geometry | undefined => {
	const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
	if (lines.length < 2) {
		return;
	}

	const header = lines[0]?.split(',') ?? [];
	const geometryIndex = header.findIndex((col) => col.trim().toLowerCase() === 'geometry');
	if (geometryIndex === -1) {
		return;
	}

	const firstDataRow = lines[1]?.split(',') ?? [];
	const geometryValue = firstDataRow[geometryIndex]?.trim() ?? '';
	return createGeoJSONGeometry(geometryValue);
};
