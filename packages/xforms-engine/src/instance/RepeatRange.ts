import type { RepeatRangeNode, RepeatRangeNodeState } from '../client/RepeatRangeNode.ts';
import type {
	ClientState,
	EngineClientState,
	EngineState,
} from '../lib/reactivity/engine-client-state.ts';
import { engineClientState } from '../lib/reactivity/engine-client-state.ts';
import type { RepeatSequenceDefinition } from '../model/RepeatSequenceDefinition.ts';
import type { RepeatInstance } from './RepeatInstance.ts';
import type { Root } from './Root.ts';
import type { DescendantNodeState } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

interface RepeatRangeState extends RepeatRangeNodeState, DescendantNodeState {
	get hint(): null;
	get label(): null;
	get children(): readonly RepeatInstance[];
	get valueOptions(): null;
	get value(): null;
}

export class RepeatRange
	extends DescendantNode<RepeatSequenceDefinition, RepeatRangeState>
	implements RepeatRangeNode, EvaluationContext, SubscribableDependency
{
	protected readonly state: EngineClientState<RepeatRangeState>;
	protected override engineState: EngineState<RepeatRangeState>;

	readonly currentState: ClientState<RepeatRangeState>;

	constructor(parent: GeneralParentNode, definition: RepeatSequenceDefinition) {
		super(parent, definition);

		const state = engineClientState<RepeatRangeState>(this.engineConfig.stateFactory, {
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

	addInstances(_afterIndex?: number | undefined, _count?: number | undefined): Root {
		throw new Error('Not implemented');
	}

	removeInstances(_startIndex: number, _count?: number | undefined): Root {
		throw new Error('Not implemented');
	}
}
