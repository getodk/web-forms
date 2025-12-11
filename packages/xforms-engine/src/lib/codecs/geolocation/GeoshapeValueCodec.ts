import { type CodecDecoder, type CodecEncoder, ValueCodec } from '../ValueCodec.ts';
import { Geoshape, type GeoshapeInputValue, type GeoshapeRuntimeValue } from './Geoshape.ts';

export class GeoshapeValueCodec extends ValueCodec<
	'geoshape',
	GeoshapeRuntimeValue,
	GeoshapeInputValue
> {
	constructor() {
		const encodeValue: CodecEncoder<GeoshapeInputValue> = (value) => {
			return Geoshape.parseGeoshapeString(value);
		};

		const decodeValue: CodecDecoder<GeoshapeRuntimeValue> = (value: string) => {
			return Geoshape.parseStringToGeoshape(value);
		};

		super('geoshape', encodeValue, decodeValue);
	}
}
