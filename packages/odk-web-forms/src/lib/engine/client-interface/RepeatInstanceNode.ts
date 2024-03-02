import type { RepeatInstanceDefinition } from '../../xform/model/RepeatInstanceDefinition.ts';
import type { DescendantNode } from './DescendantNode.ts';
import type { FormNodeID } from './FormNode.ts';
import type { FormNodeState } from './FormNodeState.ts';
import type { AnyParentNode, ParentNode } from './ParentNode.ts';
import type { RepeatRange } from './RepeatRange.ts';

export type RepeatInstanceID = FormNodeID;

interface RepeatInstanceState extends FormNodeState {
	/**
	 * Corresponds to the **zero-based** index position of a repeat instance
	 * within its containing {@link RepeatRange}. Being zero-based should simplify
	 * many common client (and engine) concerns, as it is consistent with all
	 * other JavaScript runtime indexing. It notably diverges from
	 * {@link https://www.w3.org/TR/1999/REC-xpath-19991116/ | XPath} semantics
	 * (underlying the XForms specifications which the engine implements). This
	 * divergence is addressed by {@link RepeatInstanceState.reference}, which
	 * produces an accurate one-based position predicate for reference to the
	 * repeat instance within the form's primary instance state.
	 */
	get index(): number;

	/**
	 * Note (mainly as a hint to implementation). For all other node types below
	 * the form's root, `reference` will typically be computed by joining its
	 * parent's `reference` and its own node name with a slash, e.g.
	 * `${parent.reference}/${node.definition.nodeName}`. This necessarily differs
	 * from {@link RepeatInstanceNode}s, whose `reference` will append a position
	 * predicate to the containing {@link RepeatRange}'s own `reference`.
	 * Importantly, this position predicate must be one-based (versus the
	 * zero-based {@link index}).
	 *
	 * @example (for implementation)
	 * ```ts
	 * get reference() {
	 *   return `${instanceNode.range.currentState.reference}[${}]
	 * }
	 * ```
	 */
	get reference(): string;
}

export interface RepeatInstanceNode
	extends DescendantNode<RepeatInstanceDefinition, RepeatInstanceState>,
		ParentNode<RepeatInstanceDefinition, RepeatInstanceState> {
	/**
	 * The range of repeats to which an instance belongs. This value will always
	 * differ from an instance's {@link parent}.
	 */
	readonly range: RepeatRange;

	/**
	 * Corresponds to the node actually containing the repeat instance, within
	 * the form's primary instance. This is also the {@link parent} of the repeat
	 * instance's {@link range}.
	 *
	 * @see {@link RepeatRange} for more detail about this structural oddity.
	 */
	readonly parent: AnyParentNode;
}
