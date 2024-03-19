import type { RepeatRangeNode, RepeatRangeNodeState } from '../client/RepeatRangeNode.ts';
import type { RepeatSequenceDefinition } from '../model/RepeatSequenceDefinition.ts';
import type { RepeatInstance } from './RepeatInstance.ts';
import type { Root } from './Root.ts';
import { DescendantNode, DescendantNodeState } from './abstract/DescendantNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

abstract class RepeatRangeState extends DescendantNodeState implements RepeatRangeNodeState {
	abstract override get hint(): null;
	abstract override get label(): null;
	abstract override get children(): readonly RepeatInstance[];
	abstract override get valueOptions(): null;
	abstract override get value(): null;
}

export abstract class RepeatRange
	extends DescendantNode<RepeatSequenceDefinition, RepeatRangeState>
	implements RepeatRangeNode, EvaluationContext, SubscribableDependency
{
	constructor(parent: GeneralParentNode, definition: RepeatSequenceDefinition) {
		super(parent, definition);
	}

	abstract addInstances(afterIndex?: number | undefined, count?: number | undefined): Root;
	abstract removeInstances(startIndex: number, count?: number | undefined): Root;
}
