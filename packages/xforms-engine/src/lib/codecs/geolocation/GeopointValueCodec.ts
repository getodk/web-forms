import { type CodecDecoder, type CodecEncoder, ValueCodec } from '../ValueCodec.ts';
import { Geopoint, type GeopointInputValue, type GeopointRuntimeValue } from './Geopoint.ts';

export class GeopointValueCodec extends ValueCodec<
	'geopoint',
	GeopointRuntimeValue,
	GeopointInputValue
> {
	constructor() {
		const encodeValue: CodecEncoder<GeopointInputValue> = (value) => {
			return Geopoint.parseGeopointToString(value);
		};

		const decodeValue: CodecDecoder<GeopointRuntimeValue> = (value: string) => {
			return Geopoint.parseStringToGeopoint(value);
		};

		super('geopoint', encodeValue, decodeValue);
	}
}
