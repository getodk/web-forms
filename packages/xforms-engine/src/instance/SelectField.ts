import type { AnySelectDefinition } from '../body/control/select/SelectDefinition.ts';
import type { SelectItem, SelectNode, SelectNodeState } from '../client/SelectNode.ts';
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

export interface SelectFieldDefinition extends ValueNodeDefinition {
	readonly bodyElement: AnySelectDefinition;
}

interface SelectFieldState extends SelectNodeState, DescendantNodeState {
	get children(): null;
	get valueOptions(): readonly SelectItem[];
	get value(): readonly SelectItem[];
}

export class SelectField
	extends DescendantNode<SelectFieldDefinition, SelectFieldState>
	implements SelectNode, EvaluationContext, SubscribableDependency
{
	protected readonly state: EngineClientState<SelectFieldState>;
	protected override engineState: EngineState<SelectFieldState>;

	readonly currentState: ClientState<SelectFieldState>;

	constructor(parent: GeneralParentNode, definition: SelectFieldDefinition) {
		super(parent, definition);

		const state = engineClientState<SelectFieldState>(this.engineConfig.stateFactory, {
			reference: `${parent.contextReference}/${definition.nodeName}`,
			readonly: false,
			relevant: true,
			required: false,
			label: null,
			hint: null,
			children: null,
			valueOptions: [],
			value: [],
		});

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = state.clientState;
	}

	// SelectNode
	select(_item: SelectItem): Root {
		throw new Error('Not implemented');
	}

	deselect(_item: SelectItem): Root {
		throw new Error('Not implemented');
	}
}
