import type { AttributeNode } from '../client/AttributeNode.ts';
import type { InstanceState } from '../client/index.ts';
import { createAttributeNodeInstanceState } from '../lib/client-reactivity/instance-state/createAttributeNodeInstanceState.ts';
import { getSharedValueCodec, type RuntimeInputValue, type RuntimeValue } from '../lib/codecs/getSharedValueCodec.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import type { RootAttributeDefinition } from '../parse/model/RootAttributeDefinition.ts';
import { ValueNode, type ValueNodeStateSpec } from './abstract/ValueNode.ts';
import type { AnyNode } from './hierarchy.ts';
import type { ClientReactiveSerializableAttributeNode } from './internal-api/serialization/ClientReactiveSerializableAttributeNode.ts';
import type { Root } from './Root.ts';


export class Attribute
	extends ValueNode<'string', RootAttributeDefinition, RuntimeValue<'string'>, RuntimeInputValue<'string'>>
	implements AttributeNode, ClientReactiveSerializableAttributeNode
{

	// InstanceNode
	protected readonly state: ValueNodeStateSpec<string>;
	protected readonly engineState: EngineState<ValueNodeStateSpec<string>>;
	
	// ValueNode
	readonly nodeType = 'attribute';
	readonly currentState: CurrentState<ValueNodeStateSpec<string>>;
	override readonly instanceState: InstanceState;

	readonly appearances = null;
	readonly nodeOptions = null;

	constructor(
		parent: AnyNode,
		definition: RootAttributeDefinition
	) {

		const codec = getSharedValueCodec('string');
		super(parent, null, definition, codec); // TODO this is complaining because I'm now treading leaf nodes as parents.

		const getInstanceValue = this.getInstanceValue;

		const state = createSharedNodeState(
			this.scope,
			{
				reference: `${parent.contextReference()}/${definition.qualifiedName.getPrefixedName()}`,
				readonly: false,
				relevant: true,
				required: false,

				label: null,
				hint: null,
				children: null,
				valueOptions: null,
				value: this.valueState,
				instanceValue: this.getInstanceValue,
				attributes: null
			},
			this.instanceConfig
		);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = state.currentState;
		this.instanceState = createAttributeNodeInstanceState(this);
		

	}

	setValue(value: string): Root {
		this.setValueState(value);

		return this.root;
	}
}
