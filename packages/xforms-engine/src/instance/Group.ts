import type { Accessor } from 'solid-js';
import type { GroupDefinition, GroupNode, GroupNodeAppearances } from '../client/GroupNode.ts';
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
import type { DescendantNodeSharedStateSpec } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import { buildChildren } from './children.ts';
import type { GeneralChildNode, GeneralParentNode } from './hierarchy.ts';
import type { NodeID } from './identity.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

// prettier-ignore
interface GroupStateSpec extends DescendantNodeSharedStateSpec {
	readonly label: Accessor<TextRange<'label'> | null>;
	readonly hint: null;
	readonly children: Accessor<readonly NodeID[]>;
	readonly valueOptions: null;
	readonly value: null;
}

export class Group
	extends DescendantNode<GroupDefinition, GroupStateSpec, GeneralChildNode>
	implements GroupNode, EvaluationContext, SubscribableDependency
{
	private readonly childrenState: ChildrenState<GeneralChildNode>;

	// InstanceNode
	protected readonly state: SharedNodeState<GroupStateSpec>;
	protected override engineState: EngineState<GroupStateSpec>;

	// GroupNode
	readonly nodeType = 'group';
	readonly appearances: GroupNodeAppearances;
	readonly currentState: MaterializedChildren<CurrentState<GroupStateSpec>, GeneralChildNode>;

	constructor(parent: GeneralParentNode, definition: GroupDefinition) {
		super(parent, definition);

		this.appearances = definition.bodyElement.appearances;

		const childrenState = createChildrenState<Group, GeneralChildNode>(this);

		this.childrenState = childrenState;

		const state = createSharedNodeState(
			this.scope,
			{
				...this.buildSharedStateSpec(parent, definition),

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

		childrenState.setChildren(buildChildren(this));
	}

	protected computeReference(parent: GeneralParentNode): string {
		return this.computeChildStepReference(parent);
	}

	getChildren(): readonly GeneralChildNode[] {
		return this.childrenState.getChildren();
	}
}
