import { type CodecDecoder, type CodecEncoder, ValueCodec } from '../ValueCodec.ts';
import { Geopoint, type GeopointValue } from './Geopoint.ts';

export type GeopointRuntimeValue = GeopointValue | null;

export type GeopointInputValue = GeopointRuntimeValue | string;

const DEGREES_MAX = {
	latitude: 90,
	longitude: 180,
} as const;

const isValidDegrees = (
	coordinate: keyof typeof DEGREES_MAX,
	degrees: number | undefined
): degrees is number => {
	return (
		typeof degrees === 'number' && !isNaN(degrees) && Math.abs(degrees) <= DEGREES_MAX[coordinate]
	);
};

const isGeopointRuntimeValue = (coordinates: number[]) => {
	return (
		coordinates.length >= 2 && coordinates.length <= 4 && coordinates.every((item) => item != null)
	);
};

const decodeStringValue = (value: GeopointInputValue): GeopointRuntimeValue => {
	if (typeof value !== 'string' || value.trim() === '') {
		return null;
	}

	const coordinates = value.split(/\s+/).map(Number);
	if (!isGeopointRuntimeValue(coordinates)) {
		return null;
	}

	const [latitude, longitude, altitude = null, accuracy = null] = coordinates;

	if (!isValidDegrees('latitude', latitude) || !isValidDegrees('longitude', longitude)) {
		return null;
	}

	return { latitude, longitude, altitude, accuracy };
};

export class GeopointValueCodec extends ValueCodec<
	'geopoint',
	GeopointRuntimeValue,
	GeopointInputValue
> {
	constructor() {
		const encodeValue: CodecEncoder<GeopointInputValue> = (value) => {
			const geopointValue = typeof value === 'string' ? decodeStringValue(value) : value;

			if (geopointValue == null) {
				return '';
			}

			const geopoint =  new Geopoint(geopointValue);
			return geopoint
				.getTuple()
				.map((item) => item.value)
				.join(' ');
		};

		const decodeValue: CodecDecoder<GeopointRuntimeValue> = (value: string) => {
			return decodeStringValue(value);
		};

		super('geopoint', encodeValue, decodeValue);
	}
}
