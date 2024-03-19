import type { GroupDefinition, GroupNode, GroupNodeState } from '../client/GroupNode.ts';
import { DescendantNode, DescendantNodeState } from './abstract/DescendantNode.ts';
import type { GeneralChildNode, GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

abstract class GroupState extends DescendantNodeState implements GroupNodeState {
	abstract override get hint(): null;
	abstract override get children(): readonly GeneralChildNode[];
	abstract override get valueOptions(): null;
	abstract override get value(): null;
}

export abstract class Group
	extends DescendantNode<GroupDefinition, GroupState>
	implements GroupNode, EvaluationContext, SubscribableDependency
{
	constructor(parent: GeneralParentNode, definition: GroupDefinition) {
		super(parent, definition);
	}
}
