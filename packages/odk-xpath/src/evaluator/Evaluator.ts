import { Temporal } from '@js-temporal/polyfill';
import type { EvaluationContextOptions } from '../context/EvaluationContext.ts';
import { EvaluationContext } from '../context/EvaluationContext.ts';
import { XFormsContext } from '../context/xforms/XFormsContext.ts';
import {
	enketoFunctionLibrary,
	fnFunctionLibrary,
	javarosaFunctionLibrary,
	xformsFunctionLibrary,
} from '../functions/index.ts';
import type { AnyParentNode, ContextNode } from '../lib/dom/types.ts';
import type {
	AnyXPathEvaluator,
	XPathNSResolver,
	XPathNamespaceResolverObject,
	XPathResultType,
} from '../shared/index.ts';
import type { BaseParser, ParseOptions } from '../static/grammar/ExpressionParser.ts';
import { ExpressionParser } from '../static/grammar/ExpressionParser.ts';
import { createExpression } from './expression/factory.ts';
import { FunctionLibrary } from './functions/FunctionLibrary.ts';
import { FunctionLibraryCollection } from './functions/FunctionLibraryCollection.ts';
import { ResultTypes } from './result/ResultType.ts';
import { toXPathResult } from './result/index.ts';

interface EvaluatorOptions {
	// TODO: default true **for now**, but it makes sense not to (or to do this
	// a different way entirely) if we break up XPath 1.0 from XForms-supporting
	// extensions and function libraries.
	/**
	 * @default true
	 */
	readonly inferXFormsContext?: boolean;

	readonly defaultFunctionNamespaceURIs?: readonly string[];
	readonly functionLibraries?: Iterable<FunctionLibrary>;
	readonly parseOptions?: ParseOptions;
	readonly rootNode?: AnyParentNode | null | undefined;
	readonly timeZoneId?: string | undefined;
}

type MaybeNullishEntry<T> = readonly [key: string, value: T | null | undefined];
type NonNullishEntry<T> = readonly [key: string, value: T];

const isNonNullEntry = <T>(entry: MaybeNullishEntry<T>): entry is NonNullishEntry<T> =>
	entry[1] != null;

type PartialOmitNullish<T> = {
	[K in keyof T]?: Exclude<T[K], null | undefined>;
};

const partialOmitNullish = <T extends Record<PropertyKey, unknown>>(
	object: T
): PartialOmitNullish<T> =>
	Object.fromEntries(Object.entries(object).filter(isNonNullEntry)) as PartialOmitNullish<T>;

export class Evaluator implements AnyXPathEvaluator {
	// TODO: see notes on cache in `ExpressionParser.ts`, update or remove those
	// if this usage changes in a way that addresses concerns expressed there.
	protected readonly parser: ExpressionParser;

	readonly inferXFormsContext: boolean;
	readonly functions: FunctionLibraryCollection;
	readonly parseOptions: ParseOptions;
	readonly resultTypes: ResultTypes = ResultTypes;
	readonly sharedContextOptions: Partial<EvaluationContextOptions>;
	readonly timeZone: Temporal.TimeZone;

	protected currentLanguage: string | null = null;

	constructor(parser: BaseParser, options: EvaluatorOptions = {}) {
		const {
			defaultFunctionNamespaceURIs,
			functionLibraries = [
				enketoFunctionLibrary,
				fnFunctionLibrary,
				javarosaFunctionLibrary,
				xformsFunctionLibrary,
			],
			inferXFormsContext = true,
			parseOptions = {},
			rootNode,
			timeZoneId,
		} = options;

		this.inferXFormsContext = inferXFormsContext;
		this.functions = new FunctionLibraryCollection(functionLibraries, defaultFunctionNamespaceURIs);
		this.parseOptions = parseOptions;
		this.parser = ExpressionParser.from(parser);
		this.sharedContextOptions = partialOmitNullish({
			rootNode,
		});
		this.timeZone = new Temporal.TimeZone(timeZoneId ?? Temporal.Now.timeZoneId());
	}

	getCurrentLanguage(): string | null {
		return this.currentLanguage;
	}

	setCurrentLanguage(language: string | null) {
		this.currentLanguage = language;
	}

	evaluate(
		expression: string,
		contextNode: Node,
		namespaceResolver: XPathNSResolver | null,
		resultType: XPathResultType | null
	) {
		const tree = this.parser.parse(expression, this.parseOptions);

		const evaluationContextNamespaceResolver: XPathNamespaceResolverObject | null =
			typeof namespaceResolver === 'function'
				? {
						lookupNamespaceURI: namespaceResolver,
				  }
				: namespaceResolver;

		const xformsContext = this.inferXFormsContext
			? XFormsContext.from(contextNode, this.currentLanguage)
			: null;
		const contextOptions = partialOmitNullish({
			...this.sharedContextOptions,
			namespaceResolver: evaluationContextNamespaceResolver,
			xformsContext,
		});

		const expr = createExpression(tree.rootNode);
		const context = new EvaluationContext(this, contextNode as ContextNode, contextOptions);
		const results = expr.evaluate(context);

		return toXPathResult(resultType ?? XPathResult.ANY_TYPE, results);
	}
}
