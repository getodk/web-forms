import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import type { GroupDefinition, GroupNode, GroupNodeAppearances } from '../client/GroupNode.ts';
import type { FormNodeID } from '../client/identity.ts';
import type { InstanceState } from '../client/serialization/InstanceState.ts';
import type { TextRange } from '../client/TextRange.ts';
import type { AncestorNodeValidationState } from '../client/validation.ts';
import type { XFormsXPathElement } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import type { StaticElement } from '../integration/xpath/static-dom/StaticElement.ts';
import { createParentNodeInstanceState } from '../lib/client-reactivity/instance-state/createParentNodeInstanceState.ts';
import type { ChildrenState } from '../lib/reactivity/createChildrenState.ts';
import { createChildrenState } from '../lib/reactivity/createChildrenState.ts';
import type { MaterializedChildren } from '../lib/reactivity/materializeCurrentStateChildren.ts';
import { materializeCurrentStateChildren } from '../lib/reactivity/materializeCurrentStateChildren.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createNodeLabel } from '../lib/reactivity/text/createNodeLabel.ts';
import { createAggregatedViolations } from '../lib/reactivity/validation/createAggregatedViolations.ts';
import type { DescendantNodeSharedStateSpec } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import { buildChildren } from './children.ts';
import type { GeneralChildNode, GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { ClientReactiveSerializableParentNode } from './internal-api/serialization/ClientReactiveSerializableParentNode.ts';

// prettier-ignore
interface GroupStateSpec extends DescendantNodeSharedStateSpec {
	readonly label: Accessor<TextRange<'label'> | null>;
	readonly hint: null;
	readonly children: Accessor<readonly FormNodeID[]>;
	readonly valueOptions: null;
	readonly value: null;
}

export class Group
	extends DescendantNode<GroupDefinition, GroupStateSpec, GeneralParentNode, GeneralChildNode>
	implements
		GroupNode,
		XFormsXPathElement,
		EvaluationContext,
		ClientReactiveSerializableParentNode<GeneralChildNode>
{
	private readonly childrenState: ChildrenState<GeneralChildNode>;

	override readonly [XPathNodeKindKey] = 'element';

	// InstanceNode
	protected readonly state: SharedNodeState<GroupStateSpec>;
	protected override engineState: EngineState<GroupStateSpec>;

	// GroupNode
	readonly nodeType = 'group';
	readonly appearances: GroupNodeAppearances;
	readonly nodeOptions = null;
	readonly currentState: MaterializedChildren<CurrentState<GroupStateSpec>, GeneralChildNode>;
	readonly validationState: AncestorNodeValidationState;
	readonly instanceState: InstanceState;

	constructor(
		parent: GeneralParentNode,
		instanceNode: StaticElement | null,
		definition: GroupDefinition
	) {
		super(parent, instanceNode, definition);

		this.appearances = definition.bodyElement.appearances;

		const childrenState = createChildrenState<Group, GeneralChildNode>(this);

		this.childrenState = childrenState;

		const state = createSharedNodeState(
			this.scope,
			{
				reference: this.contextReference,
				readonly: this.isReadonly,
				relevant: this.isRelevant,
				required: this.isRequired,

				label: createNodeLabel(this, definition),
				hint: null,
				children: childrenState.childIds,
				valueOptions: null,
				value: null,
			},
			this.instanceConfig
		);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = materializeCurrentStateChildren(
			this.scope,
			state.currentState,
			childrenState
		);

		childrenState.setChildren(buildChildren(this));
		this.validationState = createAggregatedViolations(this, this.instanceConfig);
		this.instanceState = createParentNodeInstanceState(this);
	}

	getChildren(): readonly GeneralChildNode[] {
		return this.childrenState.getChildren();
	}
}
