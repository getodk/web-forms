import {
	ISO_DATE_OR_DATE_TIME_NO_OFFSET_PATTERN,
	ISO_DATE_LIKE_PATTERN,
} from '@getodk/common/constants/datetime.ts';
import { Temporal } from 'temporal-polyfill';
import { type CodecDecoder, type CodecEncoder, ValueCodec } from './ValueCodec.ts';

export type DatetimeRuntimeValue = string;

export type DatetimeInputValue =
	| Date
	| Temporal.PlainDate
	| Temporal.PlainDateTime
	| Temporal.ZonedDateTime
	| string
	| null;

/**
 * Parses a string in the format 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:MM:SS' (no offset)
 * into a Temporal.PlainDateTime.
 * TODO: Datetimes with a valid timezone offset are treated as errors.
 *       User research is needed to determine whether the date should honor
 *       the timezone or be truncated to the yyyy-mm-dd format only.
 *
 * @param value - The string to parse.
 * @returns A {@link Temporal.PlainDateTime} or null
 */
const parseString = (value: string): Temporal.PlainDateTime | null => {
	if (
		value == null ||
		typeof value !== 'string' ||
		!ISO_DATE_OR_DATE_TIME_NO_OFFSET_PATTERN.test(value)
	) {
		return null;
	}

	try {
		const normalizedValue = ISO_DATE_LIKE_PATTERN.test(value) ? `${value}T00:00:00` : value;
		return Temporal.PlainDateTime.from(normalizedValue);
	} catch {
		// TODO: should we throw when codec cannot interpret the value?
		return null;
	}
};

/**
 * Converts a date-like value ({@link DatetimeInputValue}) to a 'YYYY-MM-DD' string.
 * TODO: Datetimes with a valid timezone offset are treated as errors.
 *       User research is needed to determine whether the date should honor
 *       the timezone or be truncated to the yyyy-mm-dd format only.
 *
 * @param value - The value to convert.
 * @returns A date string or empty string if invalid.
 */
const toDateString = (value: DatetimeInputValue): string => {
	if (value == null || value instanceof Temporal.ZonedDateTime) {
		return '';
	}

	try {
		if (value instanceof Temporal.PlainDate) {
			return value.toString();
		}

		if (value instanceof Temporal.PlainDateTime) {
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
		return parsed?.toString() ?? '';
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
			return toDateString(value);
		};

		super('date', encodeValue, decodeValue);
	}
}
