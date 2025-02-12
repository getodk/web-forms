import { type CodecDecoder, type CodecEncoder, ValueCodec } from './ValueCodec.ts';

export interface GeopointRuntimeValue {
	readonly latitude: number;
	readonly longitude: number;
	readonly altitude: number;
	readonly accuracy: number;
}

export type GeopointInputValue = GeopointRuntimeValue;

const DEGREES_MAX = {
	latitude: 90,
	longitude: 180,
} as const;

const isValidDegrees = (coordinate: keyof typeof DEGREES_MAX, degrees: number | undefined): boolean => {
	if (degrees == null) {
		return false;
	}

	return Math.abs(degrees) <= DEGREES_MAX[coordinate];
};

export class GeopointValueCodec extends ValueCodec<'geopoint', GeopointRuntimeValue, GeopointInputValue> {
	constructor() {
		const encodeValue: CodecEncoder<GeopointInputValue> = (value): string => {
			if (!isValidDegrees('latitude', value.latitude) || !isValidDegrees('longitude', value.longitude)) {
				throw new Error('Not valid coordinates');
			}

			return [value.latitude, value.longitude, value.altitude, value.accuracy].join(' ');
		};

		const decodeValue: CodecDecoder<GeopointRuntimeValue | null> = (value: string) => {
			const coordinates = value.split(/\s+/).map(item => Number(item));
			const isGeopointRuntimeValue = (
				coordinates.length >= 2 &&
				coordinates.length <= 4 &&
				coordinates.every((item) => item != null)
			);

			if (!isGeopointRuntimeValue) {
				return null;
			}

			const [latitude, longitude, altitude, accuracy] = coordinates;

			if (!isValidDegrees('latitude', latitude) || !isValidDegrees('longitude', longitude)) {
				return null;
			}

			return {
				latitude,
				longitude,
				altitude: altitude ?? 0,
				accuracy: accuracy ?? 0,
			};
		};

		super('geopoint', encodeValue, decodeValue);
	}
}
