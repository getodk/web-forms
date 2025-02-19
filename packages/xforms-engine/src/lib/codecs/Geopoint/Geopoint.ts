/**
 * This abstract class defines the minimal behavior for a default geopoint.
 * It can be expanded later to support units (e.g., degrees or meters),
 * which would also serve as documentation to clarify what each value represents.
 */
abstract class SemanticValue<Semantic extends string, Value extends number | null> {
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
		const { latitude, longitude, altitude, accuracy } = coordinates;

		this.internalValue = {
			latitude: new Latitude(latitude),
			longitude: new Longitude(longitude),
			altitude: this.isValidNumber(altitude) ? new Altitude(altitude) : new Altitude(null),
			accuracy: this.isValidNumber(accuracy) ? new Accuracy(accuracy) : new Accuracy(null),
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
		return this.isValidNumber(degrees) && Math.abs(degrees) <= DEGREES_MAX[coordinate];
	}

	private isValidNumber(value: number | null | undefined) {
		return value != null && !Number.isNaN(value);
	}
}
