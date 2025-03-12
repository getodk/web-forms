import { createComputed } from 'solid-js';
import type { RepeatRangeNodeAppearances } from '../../client/repeat/BaseRepeatRangeNode.ts';
import type { RepeatRangeControlledNode } from '../../client/repeat/RepeatRangeControlledNode.ts';
import type { AncestorNodeValidationState } from '../../client/validation.ts';
import { ErrorProductionDesignPendingError } from '../../error/ErrorProductionDesignPendingError.ts';
import type { XFormsXPathNodeRange } from '../../integration/xpath/adapter/XFormsXPathNode.ts';
import type { StaticElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import { createComputedExpression } from '../../lib/reactivity/createComputedExpression.ts';
import { createAggregatedViolations } from '../../lib/reactivity/validation/createAggregatedViolations.ts';
import type {
	RepeatCountControlDynamicExpression,
	RepeatCountControlFixedExpression,
} from '../../parse/expression/RepeatCountControlExpression.ts';
import type { ControlledRepeatDefinition } from '../../parse/model/RepeatDefinition.ts';
import type { GeneralParentNode } from '../hierarchy.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import { BaseRepeatRange } from './BaseRepeatRange.ts';

export class RepeatRangeControlled
	extends BaseRepeatRange<ControlledRepeatDefinition>
	implements RepeatRangeControlledNode, XFormsXPathNodeRange, EvaluationContext
{
	// RepeatRangeControlledNode
	readonly nodeType = 'repeat-range:controlled';
	readonly appearances: RepeatRangeNodeAppearances;
	readonly validationState: AncestorNodeValidationState;

	constructor(
		parent: GeneralParentNode,
		instanceNode: StaticElement,
		definition: ControlledRepeatDefinition,
		repeatInstanceNodes: readonly StaticElement[]
	) {
		super(parent, instanceNode, definition, repeatInstanceNodes);

		this.appearances = definition.bodyElement.appearances;

		const { count: countExpression, template: templateNode } = definition;

		switch (true) {
			case countExpression.isDynamic():
				this.initializeDynamicInstances(countExpression, templateNode, repeatInstanceNodes);

				break;

			case countExpression.isFixed():
				this.createFixedInstances(countExpression, templateNode, repeatInstanceNodes);

				break;

			default:
				throw new ErrorProductionDesignPendingError(
					`Unknown repeat control expression type. Expected either "dynamic" or "fixed", got: ${countExpression.type}`
				);
		}

		this.validationState = createAggregatedViolations(this, this.instanceConfig);
	}

	private initializeDynamicInstances(
		countExpression: RepeatCountControlDynamicExpression,
		templateNode: StaticElement,
		repeatInstanceNodes: readonly StaticElement[]
	): void {
		this.scope.runTask(() => {
			const computeCount = createComputedExpression(this, countExpression, {
				defaultValue: 0,
			});

			createComputed<number>((previousCount) => {
				let currentCount = computeCount();

				if (Number.isFinite(currentCount) && currentCount < 0) {
					currentCount = 0;
				}

				if (
					currentCount === previousCount ||
					// TODO: the intent of this check is to defer a count update when the
					// count expression produces a blank value. This "feels right" when
					// the count is directly controlled by the user (i.e. entering a
					// number in an input), but probably does not make sense in every
					// scenario! For instance, when a referenced node's relevance changes.
					Number.isNaN(currentCount)
				) {
					return previousCount;
				}

				if (currentCount > previousCount) {
					const delta = currentCount - previousCount;
					const instanceNodes = Array(delta)
						.fill(null)
						.map((_, index) => {
							const instanceIndex = previousCount + index;

							return repeatInstanceNodes[instanceIndex] ?? templateNode;
						});

					this.addChildren(previousCount - 1, instanceNodes);
				} else {
					const delta = previousCount - currentCount;

					this.removeChildren(currentCount, delta);
				}

				return currentCount;
			}, 0);
		});
	}

	private createFixedInstances(
		_countExpression: RepeatCountControlFixedExpression,
		templateNode: StaticElement,
		repeatInstnaceNodes: readonly StaticElement[]
	): void {
		this.scope.runTask(() => {
			if (repeatInstnaceNodes.length === 0) {
				this.addChildren(-1, [templateNode]);
			} else {
				this.addChildren(-1, repeatInstnaceNodes);
			}
		});
	}
}
