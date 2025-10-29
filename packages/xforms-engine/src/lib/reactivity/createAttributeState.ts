import type { Accessor, Setter, Signal } from 'solid-js';
import { createSignal } from 'solid-js';
import type { FormNodeID } from '../../client/identity.ts';
import type { OpaqueReactiveObjectFactory } from '../../index.ts';
import type { Attribute } from '../../instance/Attribute.ts';
import type { AnyParentNode } from '../../instance/hierarchy.ts';
import type { materializeCurrentStateChildren } from './materializeCurrentStateChildren.ts';
import type { ClientState } from './node-state/createClientState.ts';
import type { CurrentState } from './node-state/createCurrentState.ts';
import type { EngineState } from './node-state/createEngineState.ts';

export interface AttributeState {
	readonly attributes: Signal<readonly Attribute[]>;
	readonly getAttributes: Accessor<readonly Attribute[]>;
	readonly setAttributes: Setter<readonly Attribute[]>;
}

/**
 * Creates a synchronized pair of:
 *
 * - Internal children state suitable for all parent node types
 * - The same children state computed as an array of each child's
 *   {@link FormNodeID}
 *
 * This state is used, in tandem with {@link materializeCurrentStateChildren},
 * to ensure children in **client-facing** state are not written into nested
 * {@link OpaqueReactiveObjectFactory} calls.
 *
 * The produced {@link ChildrenState.children} (and its get/set convenience
 * methods) signal is intended to be used to store the engine's children state,
 * and update that state when appropriate (when appending children of any parent
 * node during form initialization, and when appending repeat instances and
 * their descendants subsequently during a form session).
 *
 * The produced {@link ChildrenState.childIds} memo is intended to be used to
 * specify each parent node's `children` in an instance of {@link EngineState}.
 * In so doing, the node's corresponding (internal, synchronized)
 * {@link ClientState} will likewise store only the children's
 * {@link FormNodeID}s.
 *
 * As a client reacts to changes in a given parent node's `children` state, that
 * node's {@link CurrentState} should produce the child nodes corresponding to
 * those {@link FormNodeID}s with the aforementioned
 * {@link materializeCurrentStateChildren}.
 */
export const createAttributeState = <Parent extends AnyParentNode>(
	parent: Parent
): AttributeState => {
	return parent.scope.runTask(() => {
		const baseState = createSignal<readonly Attribute[]>([]);
		const [getAttributes, baseSetAttributes] = baseState;

		type AttributeSetterCallback = (prev: readonly Attribute[]) => readonly Attribute[];
		type AttributeOrSetterCallback = AttributeSetterCallback | readonly Attribute[];

		const setAttributes: Setter<readonly Attribute[]> = (
			valueOrSetterCallback: AttributeOrSetterCallback
		) => {
			let setterCallback: AttributeSetterCallback;

			if (typeof valueOrSetterCallback === 'function') {
				setterCallback = valueOrSetterCallback;
			} else {
				setterCallback = (_) => valueOrSetterCallback;
			}

			return baseSetAttributes((prev) => {
				return setterCallback(prev);
			});
		};

		const attributes: Signal<readonly Attribute[]> = [getAttributes, setAttributes];

		return {
			attributes,
			getAttributes,
			setAttributes
		};
	});
};
