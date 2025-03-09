import type { RepeatRangeControlledNode } from '../../client/repeat/RepeatRangeControlledNode.ts';
import { RepeatElementDefinition } from '../body/RepeatElementDefinition.ts';
import { isConstantTruthyExpression } from '../xpath/semantic-analysis.ts';
import { DependentExpression } from './abstract/DependentExpression.ts';

export const REPEAT_COUNT_CONTROL_TYPE = {
	/** @see {@link RepeatCountControlDynamicType} */
	DYNAMIC: 'DYNAMIC',

	/** @see {@link RepeatCountControlFixedType} */
	FIXED: 'FIXED',
} as const;

type RepeatCountControlTypes = typeof REPEAT_COUNT_CONTROL_TYPE;

/**
 * Represents an expression which controls a dynamic count of a range of repeat
 * instances, i.e. as defined by the `jr:count`
 * {@link https://getodk.github.io/xforms-spec/#body-attributes | body attribute}.
 */
export type RepeatCountControlDynamicType = RepeatCountControlTypes['DYNAMIC'];

/**
 * Represents an expression which controls a fixed count of a range of repeat
 * instances, i.e. as defined by the `jr:noAddRemove`
 * {@link https://getodk.github.io/xforms-spec/#body-attributes | body attribute},
 * when its expression is `true()` (or any other expression interpreted as
 * "constantly truthy").
 *
 * Note: a fixed count will not be **evaluated** as an expression. Instead, it
 * will be **synthesized** by populating exactly the count of repeat instances
 * present in the form definition.
 *
 * @see {@link isConstantTruthyExpression} for more detail about the semantics
 * of "constantly truthy" expressions.
 */
export type RepeatCountControlFixedType = RepeatCountControlTypes['FIXED'];

// prettier-ignore
export type RepeatCountControlType =
	| RepeatCountControlDynamicType
	| RepeatCountControlFixedType;

const FIXED_NOOP_EXPRESSION = '-1';

type FixedNoopExpression = typeof FIXED_NOOP_EXPRESSION;

interface CountExpressionByType {
	readonly [REPEAT_COUNT_CONTROL_TYPE.DYNAMIC]: string;
	readonly [REPEAT_COUNT_CONTROL_TYPE.FIXED]: FixedNoopExpression;
}

type CountExpression<Type extends RepeatCountControlType> = CountExpressionByType[Type];

interface FixedCountByType {
	readonly [REPEAT_COUNT_CONTROL_TYPE.DYNAMIC]: null;
	readonly [REPEAT_COUNT_CONTROL_TYPE.FIXED]: number;
}

type FixedCount<Type extends RepeatCountControlType> = FixedCountByType[Type];

/**
 * Represents either of these
 * {@link https://getodk.github.io/xforms-spec/#body-attributes | body attributes}:
 *
 * - `jr:count`
 * - `jr:noAddRemove`
 *
 * In both cases, the downstream effect is that the engine is responsible for
 * controlling the count of a repeat range's instances. Representing both cases
 * should simplify client usage, as well as implementation of the internal
 * representation of {@link RepeatRangeControlledNode}.
 */
export class RepeatCountControlExpression<
	Type extends RepeatCountControlType = RepeatCountControlType,
> extends DependentExpression<'number'> {
	static forCountExpression(
		bodyElement: RepeatElementDefinition
	): RepeatCountControlExpression | null {
		const { countExpression } = bodyElement;

		if (countExpression == null) {
			return null;
		}

		return new this(bodyElement, REPEAT_COUNT_CONTROL_TYPE.DYNAMIC, countExpression, null);
	}

	static forNoAddRemoveExpression(
		bodyElement: RepeatElementDefinition,
		fixedCount: number
	): RepeatCountControlExpression | null {
		const { noAddRemoveExpression } = bodyElement;

		if (noAddRemoveExpression != null && isConstantTruthyExpression(noAddRemoveExpression)) {
			return new this(
				bodyElement,
				REPEAT_COUNT_CONTROL_TYPE.FIXED,
				FIXED_NOOP_EXPRESSION,
				fixedCount
			);
		}

		return null;
	}

	readonly fixedCount: FixedCount<Type>;

	private constructor(
		context: RepeatElementDefinition,
		type: RepeatCountControlDynamicType,
		expression: string,
		fixedCount: null
	);
	private constructor(
		context: RepeatElementDefinition,
		type: RepeatCountControlFixedType,
		expression: FixedNoopExpression,
		fixedCount: number
	);
	private constructor(
		context: RepeatElementDefinition,
		readonly type: Type,
		expression: CountExpression<Type>,
		fixedCount: FixedCount<Type>
	) {
		super(context, 'number', expression);

		this.fixedCount = fixedCount;
	}

	isDynamic(): this is RepeatCountControlDynamicExpression {
		return this.type === REPEAT_COUNT_CONTROL_TYPE.DYNAMIC;
	}

	isFixed(): this is RepeatCountControlFixedExpression {
		return this.type === REPEAT_COUNT_CONTROL_TYPE.FIXED;
	}
}

export type RepeatCountControlDynamicExpression =
	RepeatCountControlExpression<RepeatCountControlDynamicType>;

export type RepeatCountControlFixedExpression =
	RepeatCountControlExpression<RepeatCountControlFixedType>;
