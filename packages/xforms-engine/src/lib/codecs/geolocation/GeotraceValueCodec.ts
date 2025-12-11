import { type CodecDecoder, type CodecEncoder, ValueCodec } from '../ValueCodec.ts';
import { Geotrace, type GeotraceInputValue, type GeotraceRuntimeValue } from './Geotrace.ts';

export class GeotraceValueCodec extends ValueCodec<
	'geotrace',
	GeotraceRuntimeValue,
	GeotraceInputValue
> {
	constructor() {
		const encodeValue: CodecEncoder<GeotraceInputValue> = (value) => {
			return Geotrace.parseGeotraceString(value);
		};

		const decodeValue: CodecDecoder<GeotraceRuntimeValue> = (value: string) => {
			return Geotrace.parseStringToGeotrace(value);
		};

		super('geotrace', encodeValue, decodeValue);
	}
}
