import { ValueTypeInvariantError } from '../../error/ValueTypeInvariantError.ts';
import { ValueCodec } from './ValueCodec.ts';

/**
 * Per {@link https://getodk.github.io/xforms-spec/#data-type:int}, which
 * specifies "as in {@link https://www.w3.org/TR/xmlschema-2/#int | XML 1.0}":
 *
 * > int is ·derived· from long by setting the value of ·maxInclusive· to be
 * > 2147483647 and ·minInclusive· to be -2147483648.
 */
const INT_BOUNDS = {
	MIN: -2_147_483_648n,
	MAX: 2_147_483_647n,
};

export type IntInputValue = bigint | number | string | null;

const encodeInt = (value: IntInputValue): string => {
	if (value == null) {
		return '';
	}

	if (typeof value === 'string') {
		decodeInt(value);
	}

	return String(value);
};

export type IntRuntimeValue = bigint | null;

/**
 * Note: Collect/JavaRosa trim decimal values (i.e. round closest to zero). We
 * do the same.
 *
 * @todo Note that we enforce bounds **after** rounding, which may not be quite
 * right! Look at actual Collect/JR implementation to align.
 */
const decodeInt = (value: string): IntRuntimeValue => {
	if (value === '') {
		return null;
	}

	try {
		return BigInt(value);
	} catch {
		// ...
	}

	let decoded: bigint | null = null;

	if (decoded == null) {
		const numberValue = Number(value);

		if (!Number.isNaN(numberValue)) {
			decoded = BigInt(numberValue | 0);
		}
	}

	if (decoded == null) {
		return decoded;
	}

	if (decoded < INT_BOUNDS.MIN || decoded > INT_BOUNDS.MAX) {
		throw new ValueTypeInvariantError(
			'int',
			`Unable to decode int value from ${JSON.stringify(value)}: expected value to be between ${INT_BOUNDS.MIN} and ${INT_BOUNDS.MAX} (inclusive)`
		);
	}

	return decoded;
};

export class IntValueCodec extends ValueCodec<'int', IntRuntimeValue, IntInputValue> {
	constructor() {
		super('int', encodeInt, decodeInt);
	}
}
