import type { AnySelectDefinition } from '../body/control/select/SelectDefinition.ts';
import type { SelectItem, SelectNode, SelectNodeState } from '../client/SelectNode.ts';
import type { ValueNodeDefinition } from '../model/ValueNodeDefinition.ts';
import type { Root } from './Root.ts';
import { DescendantNode, DescendantNodeState } from './abstract/DescendantNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

export interface SelectFieldDefinition extends ValueNodeDefinition {
	readonly bodyElement: AnySelectDefinition;
}

abstract class SelectFieldState extends DescendantNodeState implements SelectNodeState {
	abstract override get children(): null;
	abstract override get valueOptions(): readonly SelectItem[];
	abstract override get value(): readonly SelectItem[];
}

export abstract class SelectField
	extends DescendantNode<SelectFieldDefinition, SelectFieldState>
	implements SelectNode, EvaluationContext, SubscribableDependency
{
	constructor(parent: GeneralParentNode, definition: SelectFieldDefinition) {
		super(parent, definition);
	}

	// SelectNode
	abstract select(item: SelectItem): Root;
	abstract deselect(item: SelectItem): Root;
}
