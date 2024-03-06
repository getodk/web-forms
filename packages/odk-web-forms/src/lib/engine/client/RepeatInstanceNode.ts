import type { RepeatInstanceDefinition } from '../../xform/model/RepeatInstanceDefinition.ts';
import type { BaseNode, BaseNodeState } from './BaseNode.ts';
import type { RepeatRangeNode } from './RepeatRangeNode.ts';
import type { RootNode } from './RootNode.ts';
import type { GeneralChildNode } from './hierarchy.ts';

export interface RepeatInstanceNodeState extends BaseNodeState {
	// TODO(?): Previous iteration included an `index` getter here. I don't see it
	// accessed by the current (Solid) client, and I don't know that it really has
	// any use to a client that wouldn't be satisfied by accessing the same index
	// while iterating the parent range's children.

	get hint(): null;
	get children(): readonly GeneralChildNode[];
	get value(): null;
}

export interface RepeatInstanceNode extends BaseNode {
	readonly definition: RepeatInstanceDefinition;
	readonly root: RootNode;

	/**
	 * A repeat instance may only be a child of a {@link RepeatRangeNode}.
	 *
	 * Note: the web-forms engine's representation of this structure differs from
	 * the underlying XForms specification's primary instance structure.
	 *
	 * @see {@link RepeatRangeNode} for additional detail.
	 */
	readonly parent: RepeatRangeNode;

	readonly currentState: RepeatInstanceNodeState;
}
