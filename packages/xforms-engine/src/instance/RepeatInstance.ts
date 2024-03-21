import { createSignal } from 'solid-js';
import type {
	RepeatDefinition,
	RepeatInstanceNode,
	RepeatInstanceNodeState,
} from '../client/RepeatInstanceNode.ts';
import type {
	ClientState,
	EngineClientState,
	EngineState,
} from '../lib/reactivity/engine-client-state.ts';
import { engineClientState } from '../lib/reactivity/engine-client-state.ts';
import type { RepeatRange } from './RepeatRange.ts';
import type { DescendantNodeState } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import { buildChildren } from './children.ts';
import type { GeneralChildNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

interface RepeatInstanceState extends RepeatInstanceNodeState, DescendantNodeState {
	get hint(): null;
	get children(): readonly GeneralChildNode[];
	get valueOptions(): null;
	get value(): null;
}

export class RepeatInstance
	extends DescendantNode<RepeatDefinition, RepeatInstanceState>
	implements RepeatInstanceNode, EvaluationContext, SubscribableDependency
{
	protected readonly state: EngineClientState<RepeatInstanceState>;
	protected override engineState: EngineState<RepeatInstanceState>;

	readonly currentState: ClientState<RepeatInstanceState>;

	constructor(
		override readonly parent: RepeatRange,
		definition: RepeatDefinition,
		initialIndex: number
	) {
		super(parent, definition);

		const [children, setChildren] = createSignal<readonly GeneralChildNode[]>([]);

		const initialPosition = initialIndex + 1;

		const state = engineClientState<RepeatInstanceState>(this.engineConfig.stateFactory, {
			reference: `${parent.contextReference}[${initialPosition}]`,
			readonly: false,
			relevant: true,
			required: false,
			label: null,
			hint: null,
			valueOptions: null,
			value: null,

			get children() {
				return children();
			},
		});

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = state.clientState;

		setChildren(buildChildren(this));
	}
}
