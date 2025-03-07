import { type CodecDecoder, type CodecEncoder, ValueCodec } from '../ValueCodec.ts';
import { Date, type DateInputValue, type DateRuntimeValue } from './Date.ts';

export class DateValueCodec extends ValueCodec<
	'date',
	DateRuntimeValue,
	DateInputValue
> {
	constructor() {
		const encodeValue: CodecEncoder<DateInputValue> = (value) => {
			return Date.toDateString(value);
		};

		const decodeValue: CodecDecoder<DateRuntimeValue> = (value: string) => {
			return Date.parseString(value);
		};

		super('date', encodeValue, decodeValue);
	}
}
