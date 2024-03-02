import type { DescendentNodeDefinition } from '../../xform/model/DescendentNodeDefinition.ts';
import type { AnyNodeDefinition } from '../../xform/model/NodeDefinition.ts';
import type { FormNode } from './FormNode.ts';
import type { FormNodeState } from './FormNodeState.ts';
import type { AnyParentNode } from './ParentNode.ts';
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- referenced in JSDoc
import type { RootNode } from './RootNode.ts';

// prettier-ignore
type AnyDescendantDefinition =
	& AnyNodeDefinition
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	& DescendentNodeDefinition<any>

/**
 * Abstract interface for any node with a parent (i.e. any node other than
 * the {@link RootNode})
 */
export interface DescendantNode<
	Definition extends AnyDescendantDefinition,
	CurrentState extends FormNodeState,
> extends FormNode<Definition, CurrentState> {
	readonly parent: AnyParentNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyDescendantNode = DescendantNode<any, any>;
