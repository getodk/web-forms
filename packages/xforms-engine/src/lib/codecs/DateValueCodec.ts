import { ISO_DATE_OR_DATE_TIME_NO_OFFSET_PATTERN } from '@getodk/common/constants/datetime.ts';
import { Temporal } from 'temporal-polyfill';
import { type CodecDecoder, type CodecEncoder, ValueCodec } from './ValueCodec.ts';

export type DatetimeRuntimeValue = Temporal.PlainDate | null;

export type DatetimeInputValue =
	| Date
	| Temporal.PlainDate
	| Temporal.PlainDateTime
	| Temporal.ZonedDateTime
	| string
	| null;

/**
 * Parses a string in the format 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:MM:SS' (no offset)
 * into a Temporal.PlainDate.
 * @param value - The string to parse.
 * @returns A {@link DatetimeRuntimeValue}
 */
const parseString = (value: string): DatetimeRuntimeValue => {
	if (value == null || typeof value !== 'string') {
		return null;
	}

	if (!ISO_DATE_OR_DATE_TIME_NO_OFFSET_PATTERN.test(value)) {
		return null;
	}

	try {
		const dateOnly = value.split('T')[0];
		if (dateOnly == null) {
			return null;
		}

		return Temporal.PlainDate.from(dateOnly);
	} catch {
		// TODO: should we throw when codec cannot interpret the value?
		return null;
	}
};

/**
 * Converts a date-like value ({@link DatetimeInputValue}) to a 'YYYY-MM-DD' string.
 * @param value - The value to convert.
 * @returns A date string or empty string if invalid.
 */
const toDateString = (value: DatetimeInputValue): string => {
	if (value == null) {
		return '';
	}

	try {
		if (value instanceof Temporal.PlainDate) {
			return value.toString();
		}

		if (value instanceof Temporal.PlainDateTime || value instanceof Temporal.ZonedDateTime) {
			return value.toPlainDate().toString();
		}

		if (value instanceof Date) {
			return Temporal.PlainDate.from({
				year: value.getFullYear(),
				month: value.getMonth() + 1,
				day: value.getDate(),
			}).toString();
		}

		const parsed = parseString(String(value));
		return parsed == null ? '' : parsed.toString();
	} catch {
		// TODO: should we throw when codec cannot interpret the value?
		return '';
	}
};

export class DateValueCodec extends ValueCodec<'date', DatetimeRuntimeValue, DatetimeInputValue> {
	constructor() {
		const encodeValue: CodecEncoder<DatetimeInputValue> = (value) => {
			return toDateString(value);
		};

		const decodeValue: CodecDecoder<DatetimeRuntimeValue> = (value: string) => {
			return parseString(value);
		};

		super('date', encodeValue, decodeValue);
	}
}
