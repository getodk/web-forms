import { Temporal } from 'temporal-polyfill';
import {
	ISO_DATE_LIKE_PATTERN,
	ISO_DATE_OR_DATE_TIME_LIKE_PATTERN,
	ISO_DATE_TIME_LIKE_PATTERN,
} from '@getodk/common/constants/datetime.ts';

export type DatetimeRuntimeValue =
	| Temporal.PlainDate
	| Temporal.PlainDateTime
	| Temporal.ZonedDateTime
	| null;

export type DatetimeInputValue =
	| Date
	| Temporal.PlainDate
	| Temporal.PlainDateTime
	| Temporal.ZonedDateTime
	| string
	| null;

export class Datetime {
	static parseString(value: string): DatetimeRuntimeValue {
		if (
			value == null ||
			typeof value !== 'string' ||
			!ISO_DATE_OR_DATE_TIME_LIKE_PATTERN.test(value)
		) {
			return null;
		}

		try {
			if (ISO_DATE_LIKE_PATTERN.test(value) && !value.includes('T')) {
				return Temporal.PlainDate.from(value);
			}

			if (ISO_DATE_TIME_LIKE_PATTERN.test(value)) {
				return Temporal.PlainDateTime.from(value);
			}

			return Temporal.ZonedDateTime.from(value);
		} catch {
			// TODO: should we throw when codec cannot interpret the value?
			return null;
		}
	}

	static toDateString(value: DatetimeInputValue): string {
		if (value == null) {
			return '';
		}

		try {
			if (
				value instanceof Temporal.ZonedDateTime ||
				value instanceof Temporal.PlainDateTime ||
				value instanceof Temporal.PlainDate
			) {
				return value.toString();
			}

			if (value instanceof Date) {
				return Temporal.ZonedDateTime.from({
					timeZoneId: Temporal.Now.timeZoneId(),
					year: value.getFullYear(),
					month: value.getMonth() + 1,
					day: value.getDate(),
					hour: value.getHours(),
					minute: value.getMinutes(),
					second: value.getSeconds(),
					millisecond: value.getMilliseconds(),
				}).toString();
			}

			const parsedValue = Datetime.parseString(value);
			return parsedValue == null ? '' : parsedValue.toString();
		} catch {
			// TODO: should we throw when codec cannot interpret the value?
			return '';
		}
	}
}
