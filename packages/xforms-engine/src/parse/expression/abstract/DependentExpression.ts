import type { EngineXPathEvaluator } from '../../../integration/xpath/EngineXPathEvaluator.ts';
import type {
	ConstantExpression,
	ConstantTruthyExpression,
} from '../../xpath/semantic-analysis.ts';
import {
	isConstantExpression,
	isConstantTruthyExpression,
	isTranslationExpression,
} from '../../xpath/semantic-analysis.ts';
import type { DependencyContext } from './DependencyContext.ts';

const evaluatorMethodsByResultType = {
	boolean: 'evaluateBoolean',
	nodes: 'evaluateNodes',
	number: 'evaluateNumber',
	string: 'evaluateString',
} as const;

type EvaluatorMethodsByResultType = typeof evaluatorMethodsByResultType;

export type DependentExpressionResultType = keyof EvaluatorMethodsByResultType;

export type DependentExpressionEvaluatorMethod<Type extends DependentExpressionResultType> =
	EvaluatorMethodsByResultType[Type];

export type DependentExpressionResult<Type extends DependentExpressionResultType> = ReturnType<
	EngineXPathEvaluator[DependentExpressionEvaluatorMethod<Type>]
>;

interface SemanticDependencyOptions {
	/**
	 * @default false
	 */
	readonly translations?: boolean | undefined;
}

interface DependentExpressionOptions {
	/**
	 * @default false
	 */
	readonly ignoreContextReference?: boolean;

	readonly semanticDependencies?: SemanticDependencyOptions;
}

export interface ConstantDependentExpression<Type extends DependentExpressionResultType>
	extends DependentExpression<Type> {
	readonly expression: ConstantExpression;
}

export interface ConstantTruthyDependentExpression extends ConstantDependentExpression<'boolean'> {
	readonly expression: ConstantTruthyExpression;
}

export abstract class DependentExpression<Type extends DependentExpressionResultType> {
	readonly isTranslated: boolean = false;
	readonly evaluatorMethod: DependentExpressionEvaluatorMethod<Type>;
	readonly constantExpression: ConstantExpression | null;
	readonly constantTruthyExpression: ConstantTruthyExpression | null;

	constructor(
		context: DependencyContext,
		readonly resultType: Type,
		readonly expression: string,
		options: DependentExpressionOptions = {}
	) {
		if (resultType === 'boolean' && isConstantTruthyExpression(expression)) {
			this.constantTruthyExpression = expression;
			this.constantExpression = expression;
		} else if (isConstantExpression(expression)) {
			this.constantTruthyExpression = null;
			this.constantExpression = expression;
		} else {
			this.constantTruthyExpression = null;
			this.constantExpression = null;
		}

		this.evaluatorMethod = evaluatorMethodsByResultType[resultType];

		const {
			semanticDependencies = {
				translations: false,
			},
		} = options;

		const isTranslated = semanticDependencies.translations && isTranslationExpression(expression);

		if (isTranslated) {
			this.isTranslated = true;
			context.isTranslated = true;
		}
	}

	isConstantExpression(): this is ConstantDependentExpression<Type> {
		return this.constantExpression != null;
	}

	isConstantTruthyExpression(): this is ConstantTruthyDependentExpression {
		return this.resultType === 'boolean' && this.constantTruthyExpression != null;
	}

	toString(): string | null {
		return this.expression;
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyDependentExpression = DependentExpression<any>;
