import type { SubtreeDefinition, SubtreeNode, SubtreeNodeState } from '../client/SubtreeNode.ts';
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

interface SubtreeState extends SubtreeNodeState, DescendantNodeState {
	get hint(): null;
	get label(): null;
	get children(): readonly GeneralChildNode[];
	get valueOptions(): null;
	get value(): null;
}

export class Subtree
	extends DescendantNode<SubtreeDefinition, SubtreeState>
	implements SubtreeNode, EvaluationContext, SubscribableDependency
{
	protected readonly state: EngineClientState<SubtreeState>;
	protected override engineState: EngineState<SubtreeState>;

	readonly currentState: ClientState<SubtreeState>;

	constructor(parent: GeneralParentNode, definition: SubtreeDefinition) {
		super(parent, definition);

		const state = engineClientState<SubtreeState>(this.engineConfig.stateFactory, {
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
