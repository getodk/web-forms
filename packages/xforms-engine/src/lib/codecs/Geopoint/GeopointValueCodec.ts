import { type CodecDecoder, type CodecEncoder, ValueCodec } from '../ValueCodec.ts';
import { Geopoint, type GeopointRuntimeValue } from './Geopoint.ts';

// TODO: Add support for GeoJSONValue
export type GeopointInputValue = GeopointRuntimeValue | string;

const decodeStringValue = (value: GeopointInputValue): GeopointRuntimeValue => {
	if (typeof value !== 'string' || value.trim() === '') {
		return null;
	}

	const [latitude, longitude, altitude = null, accuracy = null] = value.split(/\s+/).map(Number);

	if (latitude == null || longitude == null) {
		return null;
	}

	return new Geopoint({ latitude, longitude, altitude, accuracy }).getRuntimeValue();
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

			return new Geopoint(geopointValue)
				.getTuple()
				.map((item) => item.value ?? 0)
				.join(' ');
		};

		const decodeValue: CodecDecoder<GeopointRuntimeValue> = (value: string) => {
			return decodeStringValue(value);
		};

		super('geopoint', encodeValue, decodeValue);
	}
}
