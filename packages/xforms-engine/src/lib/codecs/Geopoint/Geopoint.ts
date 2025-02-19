abstract class SemanticValue<Semantic extends string, Value extends number | null> {
	// @ts-expect-error TS6133: '_semanticType' is declared but its value is never read
	private static readonly _semanticType: unique symbol;
	abstract readonly semantic: Semantic;

	constructor(readonly value: Value) {}
}

class Latitude extends SemanticValue<'latitude', number> {
	readonly semantic = 'latitude';
}

class Longitude extends SemanticValue<'longitude', number> {
	readonly semantic = 'longitude';
}

class Altitude<Value extends number | null = number> extends SemanticValue<'altitude', Value> {
	readonly semantic = 'altitude';
}

class Accuracy<Value extends number | null = number> extends SemanticValue<'accuracy', Value> {
	readonly semantic = 'accuracy';
}

export interface GeopointValue {
	readonly latitude: number;
	readonly longitude: number;
	readonly altitude: number | null;
	readonly accuracy: number | null;
}

export type GeopointRuntimeValue = GeopointValue | null;

interface GeopointInternalValue {
	readonly latitude: Latitude;
	readonly longitude: Longitude;
	readonly altitude: Altitude<number> | Altitude<null>;
	readonly accuracy: Accuracy<number> | Accuracy<null>;
}

type GeopointTuple =
	| readonly [
			latitude: Latitude,
			longitude: Longitude,
			altitude: Altitude<number> | Altitude<null>,
			accuracy: Accuracy,
	  ]
	| readonly [latitude: Latitude, longitude: Longitude, altitude: Altitude]
	| readonly [latitude: Latitude, longitude: Longitude];

const DEGREES_MAX = {
	latitude: 90,
	longitude: 180,
} as const;

type CoordinateType = keyof typeof DEGREES_MAX;

export class Geopoint {
	private readonly internalValue: GeopointInternalValue;

	constructor(coordinates: GeopointValue) {
		this.internalValue = {
			latitude: new Latitude(coordinates.latitude),
			longitude: new Longitude(coordinates.longitude),
			altitude:
				coordinates.altitude == null ? new Altitude(null) : new Altitude(coordinates.altitude),
			accuracy:
				coordinates.accuracy == null ? new Accuracy(null) : new Accuracy(coordinates.accuracy),
		};
	}

	getTuple(): GeopointTuple {
		const { latitude, longitude, altitude, accuracy } = this.internalValue;

		if (altitude.value == null && accuracy.value != null) {
			return [latitude, longitude, altitude, accuracy];
		}

		if (altitude.value != null && accuracy.value != null) {
			return [latitude, longitude, altitude, accuracy];
		}

		if (altitude.value != null) {
			return [latitude, longitude, altitude];
		}

		return [latitude, longitude];
	}

	getRuntimeValue(): GeopointRuntimeValue {
		const { latitude, longitude, altitude, accuracy } = this.internalValue;
		const isLatitude = this.isValidDegrees('latitude', latitude.value);
		const isLongitude = this.isValidDegrees('longitude', longitude.value);

		if (!isLatitude || !isLongitude) {
			return null;
		}

		return {
			latitude: latitude.value,
			longitude: longitude.value,
			altitude: altitude.value,
			accuracy: accuracy.value,
		};
	}

	private isValidDegrees(coordinate: CoordinateType, degrees: number): degrees is number {
		return !isNaN(degrees) && Math.abs(degrees) <= DEGREES_MAX[coordinate];
	}
}
