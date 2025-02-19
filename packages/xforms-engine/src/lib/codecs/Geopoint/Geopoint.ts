abstract class SemanticValue<Semantic extends string, Value extends number | null> {
	// @ts-ignore
	private declare readonly __semanticType: unique symbol;
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

interface GeopointInternalValue {
	readonly latitude: Latitude;
	readonly longitude: Longitude;
	readonly altitude: Altitude<number> | Altitude<null>;
	readonly accuracy: Accuracy<number> | Accuracy<null>;
}

type GeopointTuple =
	| readonly [latitude: Latitude, longitude: Longitude, altitude: Altitude<number> | Altitude<null>, accuracy: Accuracy]
	| readonly [latitude: Latitude, longitude: Longitude, altitude: Altitude]
	| readonly [latitude: Latitude, longitude: Longitude];

export class Geopoint {
	private readonly internalValue: GeopointInternalValue;

	constructor(coordinates: GeopointValue) {
		if (coordinates == null) {
			throw new Error(`Unable to parse geopoint: ${coordinates}`);
		}

		this.internalValue = {
			latitude: new Latitude(coordinates.latitude),
			longitude: new Longitude(coordinates.longitude),
			altitude: coordinates.altitude == null ? new Altitude(null) : new Altitude(coordinates.altitude),
			accuracy: coordinates.accuracy == null ? new Accuracy(null) : new Accuracy(coordinates.accuracy),
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

}
