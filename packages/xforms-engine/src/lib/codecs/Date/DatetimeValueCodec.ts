import { type CodecDecoder, type CodecEncoder, ValueCodec } from '../ValueCodec.ts';
import { Datetime, type DatetimeInputValue, type DatetimeRuntimeValue } from './Datetime.ts';

export class DatetimeValueCodec extends ValueCodec<
	'date',
	DatetimeRuntimeValue,
	DatetimeInputValue
> {
	constructor() {
		const encodeValue: CodecEncoder<DatetimeInputValue> = (value) => {
			return Datetime.toDateString(value);
		};

		const decodeValue: CodecDecoder<DatetimeRuntimeValue> = (value: string) => {
			return Datetime.parseString(value);
		};

		super('date', encodeValue, decodeValue);
	}
}
