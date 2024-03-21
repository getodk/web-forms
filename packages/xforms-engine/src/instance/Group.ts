import type { GroupDefinition, GroupNode, GroupNodeState } from '../client/GroupNode.ts';
import type {
	ClientState,
	EngineClientState,
	EngineState,
} from '../lib/reactivity/engine-client-state.ts';
import { engineClientState } from '../lib/reactivity/engine-client-state.ts';
import type { DescendantNodeState } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import type { GeneralChildNode, GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

interface GroupState extends GroupNodeState, DescendantNodeState {
	get hint(): null;
	get children(): readonly GeneralChildNode[];
	get valueOptions(): null;
	get value(): null;
}

export class Group
	extends DescendantNode<GroupDefinition, GroupState>
	implements GroupNode, EvaluationContext, SubscribableDependency
{
	protected readonly state: EngineClientState<GroupState>;
	protected override engineState: EngineState<GroupState>;

	readonly currentState: ClientState<GroupState>;

	constructor(parent: GeneralParentNode, definition: GroupDefinition) {
		super(parent, definition);

		const state = engineClientState<GroupState>(this.engineConfig.stateFactory, {
			reference: `${parent.contextReference}/${definition.nodeName}`,
			readonly: false,
			relevant: true,
			required: false,
			label: null,
			hint: null,
			children: [],
			valueOptions: null,
			value: null,
		});

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = state.clientState;
	}
}
