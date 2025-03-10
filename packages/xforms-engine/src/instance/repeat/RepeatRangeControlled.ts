import { createComputed } from 'solid-js';
import type { LoadFormWarnings } from '../../client/index.ts';
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
		instanceNode: StaticElement | null,
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

	/**
	 * @todo Design and produce {@link LoadFormWarnings | warnings} as values!
	 */
	private warnDroppedInstanceNodes(
		inputNodes: readonly StaticElement[],
		actualCount: number
	): void {
		const isInstanceCreation = this.rootDocument.mode === 'create';

		// We don't warn about dropping excess repeat instances from **form
		// definition** input: they're potentially used to create N > initial
		// computed `count` after load.
		if (isInstanceCreation) {
			return;
		}

		const droppedCount = inputNodes.length - actualCount;

		if (droppedCount > 0) {
			// eslint-disable-next-line no-console
			console.warn(
				`Dropped ${droppedCount} repeat instances for repeat range ${this.contextReference()}`
			);
		}
	}

	private initializeDynamicInstances(
		countExpression: RepeatCountControlDynamicExpression,
		templateNode: StaticElement,
		repeatInstanceNodes: readonly StaticElement[]
	): void {
		this.scope.runTask(() => {
			let firstRun = true;

			const computeCount = createComputedExpression(this, countExpression, {
				defaultValue: 0,
			});

			createComputed<number>((previousCount) => {
				let currentCount = computeCount();

				if (firstRun) {
					this.warnDroppedInstanceNodes(repeatInstanceNodes, currentCount);

					firstRun = false;
				}

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
		countExpression: RepeatCountControlFixedExpression,
		templateNode: StaticElement,
		repeatInstanceNodes: readonly StaticElement[]
	): void {
		this.scope.runTask(() => {
			const count = Math.max(countExpression.fixedCount, 1);

			this.warnDroppedInstanceNodes(repeatInstanceNodes, count);

			const childNodes = Array<StaticElement>(count)
				.fill(templateNode)
				.map((template, index) => {
					return repeatInstanceNodes[index] ?? template;
				});

			this.addChildren(-1, childNodes);
		});
	}
}
