import { afterEach, beforeEach } from 'vitest';
import { vi } from 'vitest';

/**
 * Global constants injected via Vite's `define` configuration option.
 * These values are replaced at build time and are available throughout
 * the test suite.
 *
 * @global
 */
declare global {
	/**
	 * The timezone identifier used for all date and time operations in tests.
	 * This string follows the IANA Time Zone Database format (e.g., 'America/Phoenix').
	 * It determines the offset and DST behavior for `Date` objects and
	 * related functions.
	 *
	 * @example 'America/Phoenix' // Fixed UTC-7, no DST
	 * @example 'Europe/London' // UTC+0 (GMT) or UTC+1 (BST) with DST
	 */
	const TZ: string;

	/**
	 * The locale string defining the language and regional formatting for tests.
	 * This follows the BCP 47 language tag format (e.g., 'en-US'). It ensures consistent formatting
	 * across tests.
	 *
	 * @example 'en-US' // American English
	 */
	const locale: string;
}

beforeEach(() => {
	const dateOnTimezone = new Date().toLocaleString(locale, { timeZone: TZ });
	vi.useFakeTimers({
		now: new Date(dateOnTimezone).getTime(),
	});
});

afterEach(() => {
	vi.useRealTimers();
});
