import type { ValueNodeDefinition } from '../../xform/model/ValueNodeDefinition.ts';
import type { DescendantNode } from './DescendantNode.ts';
import type { FormNodeState } from './FormNodeState.ts';
import type { RootNode } from './RootNode.ts';
import type { TextRange } from './text/TextRange.ts';

export interface ValueNodeState<Value = string> extends FormNodeState {
	get label(): TextRange<'label'> | null;
	get hint(): TextRange<'hint'> | null;

	get value(): Value;
}

/**
 * Represents any node which can be assigned a value. Such a node is necessarily
 * a leaf node (parent/subtree nodes cannot be assigned a value without
 * displacing their children).
 */
export interface ValueNode<
	Value = string,
	CurrentState extends ValueNodeState<Value> = ValueNodeState<Value>,
> extends DescendantNode<ValueNodeDefinition, CurrentState> {
	setValue(value: Value): RootNode;
}
