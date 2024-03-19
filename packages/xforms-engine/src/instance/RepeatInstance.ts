import type {
	RepeatDefinition,
	RepeatInstanceNode,
	RepeatInstanceNodeState,
} from '../client/RepeatInstanceNode.ts';
import type { RepeatRange } from './RepeatRange.ts';
import { DescendantNode, DescendantNodeState } from './abstract/DescendantNode.ts';
import type { GeneralChildNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

abstract class RepeatInstanceState extends DescendantNodeState implements RepeatInstanceNodeState {
	abstract override get hint(): null;
	abstract override get children(): readonly GeneralChildNode[];
	abstract override get valueOptions(): null;
	abstract override get value(): null;
}

export abstract class RepeatInstance
	extends DescendantNode<RepeatDefinition, RepeatInstanceState>
	implements RepeatInstanceNode, EvaluationContext, SubscribableDependency
{
	constructor(parent: RepeatRange, definition: RepeatDefinition) {
		super(parent, definition);
	}

	abstract override readonly parent: RepeatRange;
}
