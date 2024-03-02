import type { AnyNodeDefinition } from '../../xform/model/NodeDefinition.ts';
import type { FormNodeState } from './FormNodeState.ts';
import type { AnyParentNode } from './ParentNode.ts';
import type { RootNode } from './RootNode.ts';

export type FormNodeID = string;

/**
 * Any node in the web-forms engine's representation of an
 * {@link https://getodk.github.io/xforms-spec/ | ODK XForm}. This
 * representation is structured as a tree, which is closely correlated to the
 * concept of a [primary
 * instance](https://getodk.github.io/xforms-spec/#primary-instance).
 *
 * - {@link definition} - the definitional/schema aspects of the node itself, as
 *   parsed and derived from an
 *
 * - {@link currentState} - the node's own active state in an instance of that
 *   form (whether that state is actively being filled by a user, previously
 *   filled and open for editing, etc.)
 * - Additional common and/or node-specific properties which clients may use for
 *   traversal, reference, etc.
 * - Client-writable interfaces (setter methods), if any. What may be written is
 *   specific to the node's type, but each method will always return the form's
 *   {@link RootNode}, with the state change and any downstream state effects
 *   applied. This allows non-reactive clients (or any client which benefits
 *   from such a guarantee) to reliably handle the client's own state changes,
 *   as well as any other state affected by those changes.
 */
export interface FormNode<
	Definition extends AnyNodeDefinition,
	CurrentState extends FormNodeState,
> {
	readonly root: RootNode;
	readonly parent: AnyParentNode | null;

	readonly nodeId: FormNodeID;

	readonly definition: Definition;
	readonly currentState: CurrentState;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFormNode = FormNode<any, any>;
