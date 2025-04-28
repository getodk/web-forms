// TODO: make digest optional, and the `crypto-js` package along with it
import { MD5, SHA1, SHA256, SHA384, SHA512 } from 'crypto-js';
import * as base64 from 'crypto-js/enc-base64';
import * as hex from 'crypto-js/enc-hex';
import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import { IncompatibleRuntimeEnvironmentError } from '../../error/IncompatibleRuntimeEnvironmentError.ts';
import type { Evaluation } from '../../evaluations/Evaluation.ts';
import type { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';
import { BooleanFunction } from '../../evaluator/functions/BooleanFunction.ts';
import type { EvaluableArgument } from '../../evaluator/functions/FunctionImplementation.ts';
import { StringFunction } from '../../evaluator/functions/StringFunction.ts';
import { evaluateInt } from '../_shared/number.ts';
import { toStrings } from '../_shared/string.ts';

export const coalesce = new StringFunction(
	'coalesce',
	[
		{ arityType: 'required', typeHint: 'string' },
		{ arityType: 'required', typeHint: 'string' },
	],
	(context, [aExpression, bExpression]): string => {
		const a = aExpression!.evaluate(context).toString();

		if (a !== '') {
			return a;
		}

		return bExpression!.evaluate(context).toString();
	}
);

export const concat = new StringFunction(
	'concat',
	[{ arityType: 'variadic', typeHint: 'string' }],
	<T extends XPathNode>(
		context: LocationPathEvaluation<T>,
		args: readonly EvaluableArgument[]
	): string => {
		if (args.length === 0) {
			return '';
		}

		return args
			.flatMap((expression) => {
				const results: Evaluation<T> = expression.evaluate(context);

				return Array.from(results).map((result) => result.toString());
			})
			.join('');
	}
);

const digestHashFunctions = {
	MD5,
	'SHA-1': SHA1,
	'SHA-256': SHA256,
	'SHA-384': SHA384,
	'SHA-512': SHA512,
} as const;

type DigestAlgorithm = keyof typeof digestHashFunctions;

const isDigestAlgorithm = (algorithm: string): algorithm is DigestAlgorithm =>
	algorithm in digestHashFunctions;

const digestEncodeFunctions = {
	base64,
	hex,
};

type DigestEncoding = keyof typeof digestEncodeFunctions;

const isDigestEncoding = (encoding: string): encoding is DigestEncoding =>
	encoding in digestEncodeFunctions;

export const digest = new StringFunction(
	'digest',
	[
		{ arityType: 'required', typeHint: 'string' },
		{ arityType: 'required', typeHint: 'string' },
		{ arityType: 'optional', typeHint: 'string' },
	],
	(context, [valueExpression, algorithmExpression, encodingExpression]) => {
		const value = valueExpression!.evaluate(context).toString();
		const algorithm = algorithmExpression!.evaluate(context).toString();

		if (!isDigestAlgorithm(algorithm)) {
			throw new Error(`Unsupported digest algorithm: '${algorithm}'`);
		}

		const encoding = encodingExpression?.evaluate(context).toString() ?? 'base64';

		if (!isDigestEncoding(encoding)) {
			throw new Error(`Unsupported digest encoding: '${encoding}'`);
		}

		const fn = digestHashFunctions[algorithm];
		const encode = digestEncodeFunctions[encoding];
		const hash = fn(value);

		return encode.stringify(hash);
	}
);

export const endsWith = new BooleanFunction(
	'ends-with',
	[
		{ arityType: 'required', typeHint: 'string' },
		{ arityType: 'required', typeHint: 'string' },
	],
	(context, [haystackExpression, needleExpression]): boolean => {
		const haystack = haystackExpression!.evaluate(context).toString();
		const needle = needleExpression!.evaluate(context).toString();

		const result = haystack.endsWith(needle);

		return result;
	}
);

export const join = new StringFunction(
	'join',
	[
		{ arityType: 'required', typeHint: 'string' },
		// Deviates from ODK XForms spec, matches ORXE
		{ arityType: 'variadic' },
	],
	(context, [glueExpression, ...expressions]): string => {
		const glue = glueExpression!.evaluate(context).toString();
		const strings = toStrings(context, expressions);

		return strings.join(glue);
	}
);

export const regex = new BooleanFunction(
	'regex',
	[
		{ arityType: 'required', typeHint: 'string' },
		{ arityType: 'required', typeHint: 'string' },
	],
	(context, [valueExpression, patternExpression]): boolean => {
		const value = valueExpression!.evaluate(context).toString();
		// TODO: various memoizations (static expression, regex instance)
		const pattern = new RegExp(patternExpression!.evaluate(context).toString());

		return pattern.test(value);
	}
);

export const substr = new StringFunction(
	'substr',
	[
		{ arityType: 'required' },
		{ arityType: 'required', typeHint: 'number' },
		{ arityType: 'optional', typeHint: 'number' },
	],
	(context, [stringExpression, startExpression, endExpression]): string => {
		const string = stringExpression!.evaluate(context).toString();

		const { length } = string;

		if (length === 0) {
			return '';
		}

		let start = evaluateInt(context, startExpression!);
		let end = endExpression != null ? evaluateInt(context, endExpression) : length;

		if (start < 0) {
			start = length + start;
		}

		if (end < 0) {
			end = length + end;
		}

		end = Math.min(Math.max(0, end), length);
		start = Math.min(Math.max(0, start), length);

		return start <= end ? string.substring(start, end) : '';
	}
);

type AssertCrypto = (value: Partial<Crypto> | undefined) => asserts value is Crypto;

let didAssertCrypto = false;

const assertCrypto: AssertCrypto = (crypto) => {
	if (didAssertCrypto) {
		return;
	}

	if (typeof crypto !== 'object' || crypto == null) {
		throw new IncompatibleRuntimeEnvironmentError();
	}

	if (typeof crypto.randomUUID !== 'function' || crypto.randomUUID.length !== 0) {
		throw new IncompatibleRuntimeEnvironmentError();
	}

	didAssertCrypto = true;
};

/**
 * @todo This feature detection was introduced during the refactor to adopt a
 * DOM adapter approach. In that effort, we stopped using TypeScript's DOM lib
 * types throughout the `@getodk/xpath` src directory. It was discovered that
 * the global {@link Crypto | `crypto`} object we were depending on is
 * conditionally available:
 *
 * - Node: on all supported versions
 * - Web:
 *   {@link https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID | in secure contexts}
 *   (i.e. HTTPS is required, except for localhost)
 *
 * We should consider:
 *
 * 0. Do/should we have a general policy around support (or lack thereof) for
 *    non-secure contexts
 * 1. Does it make sense to limit availability of this function based on such a
 *    policy, and/or should we investigate a conditionally loaded dependency
 *    equivalent?
 * 2. Should we consider just adopting a dependency overall? That would be a
 *    shame if we can reasonably assume the native functionality will be
 *    available in the vast majority (or even all) of supported usage scenarios.
 */
const getGlobalCrypto = (): Crypto => {
	const { crypto } = globalThis;

	assertCrypto(crypto);

	return crypto;
};

export const uuid = new StringFunction(
	'uuid',
	[{ arityType: 'optional', typeHint: 'number' }],
	(context, [lengthExpression]) => {
		const crypto = getGlobalCrypto();

		let result: string = crypto.randomUUID();

		if (lengthExpression == null) {
			return result;
		}

		const outputLength = lengthExpression.evaluate(context).toNumber();

		if (Number.isNaN(outputLength)) {
			throw new Error('Expected a valid number for the UUID length, but received NaN.');
		}

		while (result.length < outputLength) {
			result = `${result}${crypto.randomUUID()}`;
		}

		return result.slice(0, outputLength);
	}
);
