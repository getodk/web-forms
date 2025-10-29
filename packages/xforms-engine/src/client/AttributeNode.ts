import type { Root } from '../instance/Root.ts';
import type { RootAttributeDefinition } from '../parse/model/RootAttributeDefinition.ts';
import type { OpaqueReactiveObjectFactory } from './OpaqueReactiveObjectFactory.ts';
import type { InstanceState } from './serialization/InstanceState.ts';

// TODO review all the docs in this file - it was just copy and pasted!
export interface AttributeNodeState {

	/**
	 * Certain kinds of nodes store a value state. Where they do, they will
	 * specify the type of the value directly.
	 *
	 * Parent nodes, i.e. nodes which can contain {@link children}, do not store a
	 * value state. For those nodes, their value state should always be `null`.
	 *
	 * A node's value is considered "blank" when its primary instance state is an
	 * empty string, and it is considered "non-blank" otherwise. The engine may
	 * represent node values according to aspects of the node's definition (such
	 * as its defined data type, its associated control type if any). The node's
	 * value being blank or non-blank may contribute to satisfying conditions of
	 * the node's validity ({@link constraint}, {@link required}). Otherwise, it
	 * is an internal engine consideration.
	 */
	get value(): unknown;
}

/**
 * Base interface for common/shared aspects of any node type.
 */
export interface AttributeNode {
	/**
	 * Specifies the node's general type. This can be useful for narrowing types,
	 * e.g. those of children.
	 */
	readonly nodeType: 'attribute';

	/**
	 * Each node has a definition which specifies aspects of the node defined in
	 * the form. These aspects include (but are not limited to) the node's data
	 * type, its body presentation constraints (if any), its bound nodeset, and
	 * so on...
	 *
	 * @todo Interfaces for specific (non-base) node types should override this
	 * to specify the actual (concrete or union) type of their `definition`.
	 */
	readonly definition: RootAttributeDefinition;

	/**
	 * Each node links back to the node representing the root of the form.
	 *
	 * @todo Interfaces for all concrete node types should override this to
	 * specify the actual root node type.
	 */
	readonly root: Root;

	/**
	 * Each node links back to its parent, if any. All nodes have a parent except
	 * the form's {@link root}.
	 */
	// TODO: the `children` state property discusses the fact that a child node
	// cannot be reassigned to another parent. As such, it is currently treated as
	// static. This fails to address the removal of nodes, i.e. when removing
	// repeat instances. This suggests that perhaps `parent` should also be part
	// of the node's state. However that would be insufficient to communicate the
	// same information about a removed node's descendants. Some considerations:
	//
	// 1. If `parent` becomes part of state, how do we communicate that removal is
	//    the only possible state change (as in, a child node will never be
	//    reassigned to another parent)?
	// 2. If `parent` does become nullable state, how best to convey the same
	//    information for removed descendants. Some ideas:
	//
	//    - Apply null-as-removed recursively.
	//
	//    - Borrow the browser DOM's notion of node "connected"-ness. When a node
	//      is removed, its `isConnected` property is `false`. The same is true
	//      for any of its descendants, even though they retain their own direct
	//      parent reference.
	readonly parent: unknown;

	/**
	 * Each node provides a discrete object representing the stateful aspects\* of
	 * that node which will change over time. When a client provides a
	 * {@link OpaqueReactiveObjectFactory}, the engine will update the properties
	 * of this object as their respective states change, so a client can implement
	 * reactive updates that respond to changes as they occur.
	 *
	 * \* This includes state which is either client-/user-mutable, or state which
	 *    is computed based on the core XForms computation model. Each node also
	 *    exposes {@link validationState}, which reflects the validity of the
	 *    node, or its descendants.
	 */
	readonly currentState: AttributeNodeState;


	/**
	 * Represents the current instance state of the node.
	 *
	 * @see {@link InstanceState.instanceXML} for additional detail.
	 *
	 * @todo Consider whether this can (should) be merged with
	 * {@link currentState}, while providing the same client-reactivity
	 * guarantees. (The challenge there is in defining client-reactive state which
	 * self-referentially derives state from its own definition.)
	 */
	readonly instanceState: InstanceState;

	readonly appearances: null;
	readonly nodeOptions: null;
}
