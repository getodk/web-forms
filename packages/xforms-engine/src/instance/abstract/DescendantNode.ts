import type { BaseNode, BaseNodeState } from '../../client/BaseNode.ts';
import type { TextRange } from '../../client/TextRange.ts';
import type { AnyDescendantNodeDefinition } from '../../model/DescendentNodeDefinition.ts';
import type { AnyNodeDefinition } from '../../model/NodeDefinition.ts';
import type { RepeatInstanceDefinition } from '../../model/RepeatInstanceDefinition.ts';
import type { RepeatSequenceDefinition } from '../../model/RepeatSequenceDefinition.ts';
import type { RepeatRange } from '../RepeatRange.ts';
import type { AnyChildNode, GeneralParentNode } from '../hierarchy.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from '../internal-api/SubscribableDependency.ts';
import type { InstanceNodeState } from './InstanceNode.ts';
import { InstanceNode } from './InstanceNode.ts';

/**
 * @todo
 *
 * Handles cross-cutting concerns involving computation and reactivity which are
 * general to all non-root nodes (all of which may be conditionally present for
 * a given node, but otherwise have the same behavior regardless of node type):
 *
 * - `reference` (reactive positioning of/within repeat instances)
 * - bind state expressions (`readonly`, `relevant`, `required`, `constraint`
 *   when supported, etc)
 * - reactive `value` (`calculate`)
 * - reactive `valueOptions` (select/select1 with itemsets)
 * - text ranges (`label`, `hint`)
 * - reactive `children` (at least anticipating this for repeat ranges and their
 *   repeat instances, but we may find it's beneficial for a general subscribe-
 *   on-arrival mechanism as the instance tree is built up)
 */
export abstract class DescendantNodeState implements InstanceNodeState, BaseNodeState {
	abstract get reference(): string;
	abstract get readonly(): boolean;
	abstract get relevant(): boolean;
	abstract get required(): boolean;
	abstract get label(): TextRange<'label'> | null;
	abstract get hint(): TextRange<'hint'> | null;
	abstract get children(): readonly AnyChildNode[] | null;
	abstract get valueOptions(): unknown;
	abstract get value(): unknown;
}

// prettier-ignore
export type DescendantNodeDefinition = Extract<
	AnyNodeDefinition,
	AnyDescendantNodeDefinition
>;

// prettier-ignore
type DescendantNodeParent<Definition extends DescendantNodeDefinition> =
	Definition extends RepeatInstanceDefinition
		? RepeatRange
		: GeneralParentNode;

type DescendantContextNode<Definition extends DescendantNodeDefinition> =
	Definition extends RepeatSequenceDefinition ? Comment : Element;

export abstract class DescendantNode<
		Definition extends DescendantNodeDefinition,
		State extends DescendantNodeState,
	>
	extends InstanceNode<Definition, State>
	implements BaseNode, EvaluationContext, SubscribableDependency
{
	abstract override readonly contextNode: DescendantContextNode<Definition>;

	/**
	 * To be called when:
	 *
	 * - the node itself is removed
	 * - a parent/ancestor has been removed(?)
	 *
	 * Implies, at least, a call to `this.scope.dispose()`; possibly make an
	 * exception for repeat instances, which we might want to retain in case
	 * they're re-added. This came up as a behavior of Collect/JavaRosa, and we
	 * should investigate the details and ramifications of that, and whether it's
	 * the desired behavior.
	 */
	abstract remove(): void;

	constructor(
		override readonly parent: DescendantNodeParent<Definition>,
		override readonly definition: Definition
	) {
		super(definition);
	}
}
