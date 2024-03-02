import type { RepeatSequenceDefinition } from '../../xform/model/RepeatSequenceDefinition.ts';
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- referenced in JSDoc
import type { FormNode } from './FormNode.ts';
import type { FormNodeState } from './FormNodeState.ts';
import type { ParentNode } from './ParentNode.ts';
import type { RepeatInstanceID, RepeatInstanceNode } from './RepeatInstanceNode.ts';
import type { RootNode } from './RootNode.ts';

interface RepeatRangeState extends FormNodeState {
	/**
	 * TODO: this is a hint to implementation, and we may not want to expose it
	 * as a part of the client interface. As conceived, it's a necessary
	 * implementation detail to allow computation of {@link instances} without
	 * nesting calls to the client's reactive factory.
	 */
	get instanceIDs(): Iterable<RepeatInstanceID>;

	/**
	 * TODO: this is intentionally inconsistent with {@link RepeatRange.children}
	 * (extended from {@link ParentNode}), both to call out the fact that that
	 * aspect of the interface is unsettled, and because this case represents the
	 * two important exceptions we care about modeling in the engine state tree/
	 * client interface:
	 *
	 * - {@link RepeatRange} has parent-like semantics, in that it contains and
	 *   manages its instances, but does not correspond to a node (parent or
	 *   otherwise) in the form's primary instance.
	 * - It is the only concrete case where {@link ParentNode.children} would not
	 *   actually be static. While the design we're targeting will compute this
	 *   array, its backing state ({@link instanceIDs}) is inherently reactive.
	 *   The children of all parent nodes are currently presented as if they _may
	 *   not_ be static, even though all non-repeat cases (groups, non-group
	 *   subtrees) will be.
	 */
	get instances(): readonly RepeatInstanceNode[];
}

/**
 * Represents a range, sequence, set, or collection[, ...] of
 * {@link RepeatInstanceNode}s in the web-forms engine. This is modeled as a
 * {@link FormNode}, because it accurately represents the engine's management of
 * repeat instances within a form, and represents expected usage by clients.
 *
 * Clients in particular should be advised that a given `RepeatRange` closely
 * corresponds to a pair of
 * {@link https://getodk.github.io/xforms-spec/#body-elements | `<group>` and `<repeat>` body elements}
 * with the same nodeset reference. (Forms which define a repeat without a
 * corresponding group are semantically equivalent, web-forms simplifies this by
 * producing the same runtime structure regardless.)
 *
 * However, this representation diverges from XForms model/state semantics,
 * where a range of repeats is not a node at all. To illustrate this divergence,
 * it may help to think of this node type as analogous to a
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Range | DOM `Range`}
 * (hence the current straw-man name).
 *
 * Importantly, this node-like/range-like structure is present in the web-forms
 * engine's **representation** even when empty (i.e. its state has no
 * {@link RepeatInstanceNode}s, the form's primary instance state has no
 * corresponding elements).
 *
 * @example
 *
 * ```xml
 * <h:html>
 *  <h:head>
 *    <model>
 *      <instance>
 *        <data>
 *          <!-- RepeatRange(/data/rep).currentState.instances: [ -->
 *            <rep /> <!-- RepeatInstanceNode(/data/rep[1]), -->
 *            <rep /> <!-- RepeatInstanceNode(/data/rep[2]), -->
 *          <!-- ] -->
 *        </data>
 *      </instance>
 *    </model>
 *  </h:head>
 *  <h:body>
 *    <repeat nodeset="/data/rep" />
 *  </h:body>
 * </h:html>
 * ```
 *
 * TODO: bikeshed this name!
 */
export interface RepeatRange
	extends ParentNode<RepeatSequenceDefinition, RepeatRangeState, RepeatInstanceNode> {
	/**
	 * @param afterIndex where to add new instances (defaults to end of range)
	 * @param count how many instances to add (defaults to 1)
	 */
	addInstances(afterIndex?: number, count?: number): RootNode;

	/**
	 * @param startIndex first instance to remove
	 * @param count how many instances to remove (defaults to 1)
	 */
	removeInstances(startIndex: number, count?: number): RootNode;
}
