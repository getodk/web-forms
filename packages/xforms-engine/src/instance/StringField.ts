import type { InputDefinition } from '../body/control/InputDefinition.ts';
import type { StringNode, StringNodeState } from '../client/StringNode.ts';
import type {
	ClientState,
	EngineClientState,
	EngineState,
} from '../lib/reactivity/engine-client-state.ts';
import { engineClientState } from '../lib/reactivity/engine-client-state.ts';
import type { ValueNodeDefinition } from '../model/ValueNodeDefinition.ts';
import type { Root } from './Root.ts';
import type { DescendantNodeState } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

export interface StringFieldDefinition extends ValueNodeDefinition {
	readonly bodyElement: InputDefinition | null;
}

interface StringFieldState extends StringNodeState, DescendantNodeState {
	get children(): null;
	get valueOptions(): null;
	get value(): string;
}

export class StringField
	extends DescendantNode<StringFieldDefinition, StringFieldState>
	implements StringNode, EvaluationContext, SubscribableDependency
{
	protected readonly state: EngineClientState<StringFieldState>;
	protected override engineState: EngineState<StringFieldState>;

	readonly currentState: ClientState<StringFieldState>;

	constructor(parent: GeneralParentNode, definition: StringFieldDefinition) {
		super(parent, definition);

		const state = engineClientState<StringFieldState>(this.engineConfig.stateFactory, {
			reference: `${parent.contextReference}/${definition.nodeName}`,
			readonly: false,
			relevant: true,
			required: false,
			label: null,
			hint: null,
			children: null,
			valueOptions: null,
			value: '',
		});

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = state.clientState;
	}

	// StringNode
	setValue(_value: string): Root {
		throw new Error('Not implemented');
	}
}
