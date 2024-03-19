import type { SubtreeDefinition, SubtreeNode, SubtreeNodeState } from '../client/SubtreeNode.ts';
import { DescendantNode, DescendantNodeState } from './abstract/DescendantNode.ts';
import type { GeneralChildNode, GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

abstract class SubtreeState extends DescendantNodeState implements SubtreeNodeState {
	abstract override get hint(): null;
	abstract override get label(): null;
	abstract override get children(): readonly GeneralChildNode[];
	abstract override get valueOptions(): null;
	abstract override get value(): null;
}

export abstract class Subtree
	extends DescendantNode<SubtreeDefinition, SubtreeState>
	implements SubtreeNode, EvaluationContext, SubscribableDependency
{
	constructor(parent: GeneralParentNode, definition: SubtreeDefinition) {
		super(parent, definition);
	}
}
