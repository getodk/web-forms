import type { Accessor } from 'solid-js';
import { createComputed, createSignal, on } from 'solid-js';
import type {
	RepeatDefinition,
	RepeatInstanceNode,
	RepeatInstanceNodeAppearances,
} from '../client/RepeatInstanceNode.ts';
import type { TextRange } from '../index.ts';
import type { ChildrenState } from '../lib/reactivity/createChildrenState.ts';
import { createChildrenState } from '../lib/reactivity/createChildrenState.ts';
import type { MaterializedChildren } from '../lib/reactivity/materializeCurrentStateChildren.ts';
import { materializeCurrentStateChildren } from '../lib/reactivity/materializeCurrentStateChildren.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createNodeLabel } from '../lib/reactivity/text/createNodeLabel.ts';
import type { RepeatRange } from './RepeatRange.ts';
import type { DescendantNodeSharedStateSpec } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import { buildChildren } from './children.ts';
import type { AnyChildNode, GeneralChildNode } from './hierarchy.ts';
import type { NodeID } from './identity.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

export type { RepeatDefinition };

interface RepeatInstanceStateSpec extends DescendantNodeSharedStateSpec {
	readonly label: Accessor<TextRange<'label'> | null>;
	readonly hint: null;
	readonly children: Accessor<readonly NodeID[]>;
	readonly valueOptions: null;
	readonly value: null;
}

interface RepeatInstanceOptions {
	readonly precedingPrimaryInstanceNode: Comment | Element;
	readonly precedingInstance: RepeatInstance | null;
}

export class RepeatInstance
	extends DescendantNode<RepeatDefinition, RepeatInstanceStateSpec, GeneralChildNode>
	implements RepeatInstanceNode, EvaluationContext, SubscribableDependency
{
	private readonly childrenState: ChildrenState<GeneralChildNode>;
	private readonly currentIndex: Accessor<number>;

	// InstanceNode
	protected readonly state: SharedNodeState<RepeatInstanceStateSpec>;
	protected override engineState: EngineState<RepeatInstanceStateSpec>;

	// RepeatInstanceNode
	readonly nodeType = 'repeat-instance';

	/**
	 * @see {@link RepeatRange.appearances}
	 */
	readonly appearances: RepeatInstanceNodeAppearances;

	readonly currentState: MaterializedChildren<
		CurrentState<RepeatInstanceStateSpec>,
		GeneralChildNode
	>;

	constructor(
		override readonly parent: RepeatRange,
		definition: RepeatDefinition,
		options: RepeatInstanceOptions
	) {
		super(parent, definition);

		this.appearances = definition.bodyElement.appearances;

		const childrenState = createChildrenState<RepeatInstance, GeneralChildNode>(this);

		this.childrenState = childrenState;

		options.precedingPrimaryInstanceNode.after(this.contextNode);

		const { precedingInstance } = options;
		const precedingIndex = precedingInstance?.currentIndex ?? (() => -1);
		const initialIndex = precedingIndex() + 1;
		const [currentIndex, setCurrentIndex] = createSignal(initialIndex);

		this.currentIndex = currentIndex;

		const state = createSharedNodeState(
			this.scope,
			{
				...this.buildSharedStateSpec(parent, definition),

				// TODO: only-child <group><label>
				label: createNodeLabel(this, definition),
				hint: null,
				children: childrenState.childIds,
				valueOptions: null,
				value: null,
			},
			{
				clientStateFactory: this.engineConfig.stateFactory,
			}
		);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = materializeCurrentStateChildren(state.currentState, childrenState);

		// Maintain current index state, updating as the parent range's children
		// state is changed. Notable Solid reactivity nuances:
		//
		// - `createComputed` is the Solid API which is explicitly called out for
		//   supporting performing reactive writes. It's also generally considered a
		//   "smell", but it seems the most appropriate for a first pass on this.
		// - `on(..., { defer: true })` allows us to *synchronously* delay reactive
		//   index updates until after the full form tree is built, where this
		//   `RepeatInstance` is being constructed but it hasn't yet been appended
		//   to the parent range's reactive `children`.
		// - the same logic for deferring reaction on form init should apply for
		//   adding new instances to a live form.
		this.scope.runTask(() => {
			// TODO: even as minimal as this currently is, maybe we should move this
			// into a named function under src/lib/reactivity (for consistency with
			// other reactive implementations of specific XForms semantics)?
			const computeCurrentIndex = parent.getInstanceIndex.bind(parent, this);

			createComputed(on(computeCurrentIndex, setCurrentIndex, { defer: true }));
		});

		childrenState.setChildren(buildChildren(this));
	}

	protected computeReference(parent: RepeatRange): string {
		const currentPosition = this.currentIndex() + 1;

		return `${parent.contextReference}[${currentPosition}]`;
	}

	protected override initializeContextNode(parentContextNode: Element, nodeName: string): Element {
		return this.createContextNode(parentContextNode, nodeName);
	}

	override subscribe(): void {
		super.subscribe();
		this.currentIndex();
	}

	getChildren(): readonly GeneralChildNode[] {
		return this.childrenState.getChildren();
	}

	/**
	 * Performs repeat instance node-specific removal logic, then general node
	 * removal logic, in that order:
	 *
	 * 1. At present, before any reactive state change is performed, the repeat
	 *    instance's {@link contextNode} is removed from the primary instance's
	 *    XML DOM backing store (which also removes any descendant nodes from that
	 *    store, as a side effect). This behavior may become unnecessary if/when
	 *    we phase out use of this XML DOM backing store. This should be peformed
	 *    first, so that any following reactive logic which evaluates affected
	 *    XPath expressions will be performed against a state consistent with the
	 *    repeat instance's removal (and that of its XML DOM descendants).
	 *
	 * 2. Performs any remaining removal logic as defined in
	 *    {@link DescendantNode.remove}.
	 *
	 * These removal steps **must also** occur before any update to the parent
	 * {@link RepeatRange}'s reactive children state.
	 */
	override remove(this: AnyChildNode): void {
		this.contextNode.remove();

		super.remove();
	}
}
