import {
	Geolocation,
	type LocationPoint,
} from './Geolocation.ts';

const SEPARATOR = ';';

export type GeoshapeRuntimeValue = LocationPoint[] | null;

export type GeoshapeInputValue = GeoshapeRuntimeValue | string;

export class Geoshape extends Geolocation {
	static parseStringToGeoshape(value: string): GeoshapeRuntimeValue {
		if (value.trim() === '') {
			return null;
		}

		const points = value.split(SEPARATOR).map((point) => (Geolocation.parseString(point))) as LocationPoint[];
		if (points.some((p) => p === null) || points.length < 3 || !Geolocation.isClosedShape(points)) {
			return null;
		}

		return points;
	}

	static parseGeoshapeString(points: GeoshapeInputValue): string {
		const decodedPoints = typeof points === 'string' ? Geoshape.parseStringToGeoshape(points) : points;
		if (!decodedPoints) {
			return '';
		}

		const segments = decodedPoints.map((point) => (Geolocation.toCoordinatesString(point)));
		if (segments.some((s) => !s.length)) {
			return '';
		}

		return segments.join(SEPARATOR);
	}
}
