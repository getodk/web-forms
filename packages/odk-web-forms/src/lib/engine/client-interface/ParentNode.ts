import type { AnyNodeDefinition } from '../../xform/model/NodeDefinition.ts';
import type { AnyDescendantNode } from './DescendantNode.ts';
import type { FormNode } from './FormNode.ts';
import type { FormNodeState } from './FormNodeState.ts';
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- referenced in JSDoc
import type { RootNode } from './RootNode.ts';
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- referenced in JSDoc
import type { SubtreeNode } from './SubtreeNode.ts';
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- referenced in JSDoc
import type { OpaqueReactiveObjectFactory } from './state/OpaqueReactiveObjectFactory.ts';

/**
 * A node which is a parent of other nodes. A parent node may also be a child of
 * another parent node (i.e. {@link SubtreeNode}, which is both a `ParentNode`
 * and a {@link DescendantNode}). There is one exception, which is the form's
 * {@link RootNode}.
 */
export interface ParentNode<
	Definition extends AnyNodeDefinition,
	CurrentState extends FormNodeState,
	Child extends AnyDescendantNode = AnyDescendantNode,
> extends FormNode<Definition, CurrentState> {
	/**
	 * A parent node's children _might_ be computed. If that is the case, they
	 * **WILL** be computed using a client's {@link OpaqueReactiveObjectFactory}.
	 *
	 * @todo should this be a part of the node's {@link currentState} instead?
	 * Should we further distinguish the dynamic/reactive case (repeat range)
	 * from all other cases, which will always be static?
	 */
	get children(): readonly Child[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyParentNode = ParentNode<any, any, any>;
