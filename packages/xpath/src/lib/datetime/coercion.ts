import { Temporal } from 'temporal-polyfill';
import { MILLISECOND_NANOSECONDS } from './constants.ts';
import { isISODateOrDateTimeLike } from './predicates.ts';

export const tryParseDateString = (value: string): Date | null => {
	try {
		const date = new Date(value);

		if (Number.isNaN(date.getTime())) {
			return null;
		}

		return date;
	} catch {
		// Intentionally ignored, returns `null` on failure
	}

	return null;
};

/**
 * Validates a timezone offset (e.g., "+01:00", "-23:59") to ensure it’s within the valid range.
 * Webkit (Safari) parses invalid offsets like "-24:00" while Chrome and Firefox reject them.
 * Using `Temporal.TimeZone.from` ensures consistent rejection of out-of-spec offsets
 * across browsers, aligning with the Temporal spec’s max of ±23:59.
 *
 * @param offset - The offset string to validate (e.g., "-24:00", "+01:00").
 * @returns `true` if the offset is valid, `false` otherwise.
 */
const isValidOffset = (offset: string): boolean => {
	try {
		Temporal.TimeZone.from(offset);
		return true;
	} catch {
		return false;
	}
};

export const dateTimeFromString = (
	timeZone: Temporal.TimeZone,
	value: string
): Temporal.ZonedDateTime | null => {
	if (!isISODateOrDateTimeLike(value)) {
		return null;
	}

	if (value.endsWith('Z')) {
		return Temporal.ZonedDateTime.from(value.replace(/Z$/, '[UTC]')).withTimeZone(timeZone);
	}

	const offsetRegex = /[-+]\d{2}:\d{2}$/;
	const offsetMatch = offsetRegex.exec(value);
	if (offsetMatch != null && !isValidOffset(offsetMatch[0])) {
		return null;
	}

	if (offsetRegex.test(value) || !/^\d{4}/.test(value)) {
		const date = tryParseDateString(value);

		if (date == null) {
			return null;
		}

		const dateTimeString = `${date.toISOString()}[UTC]`;

		return Temporal.ZonedDateTime.from(dateTimeString).withTimeZone(timeZone);
	}

	return Temporal.PlainDateTime.from(value).toZonedDateTime(timeZone);
};

const toNanoseconds = (milliseconds: bigint | number): bigint =>
	BigInt(milliseconds) * MILLISECOND_NANOSECONDS;

export const dateTimeFromNumber = (
	timeZone: Temporal.TimeZone,
	milliseconds: number
): Temporal.ZonedDateTime | null => {
	if (Number.isNaN(milliseconds)) {
		return null;
	}

	return new Temporal.ZonedDateTime(toNanoseconds(milliseconds), timeZone);
};
