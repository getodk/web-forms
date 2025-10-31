import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import type { AttributeNode } from '../client/AttributeNode.ts';
import type { ActiveLanguage, InstanceState, LeafNodeValidationState } from '../client/index.ts';
import type { XFormsXPathAttribute } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import type { EngineXPathEvaluator } from '../integration/xpath/EngineXPathEvaluator.ts';
import type { StaticLeafElement } from '../integration/xpath/static-dom/StaticElement.ts';
import { createAttributeNodeInstanceState } from '../lib/client-reactivity/instance-state/createAttributeNodeInstanceState.ts';
import { getSharedValueCodec, type RuntimeInputValue, type RuntimeValue } from '../lib/codecs/getSharedValueCodec.ts';
import type { RuntimeValueSetter, RuntimeValueState } from '../lib/codecs/ValueCodec.ts';
import { createInstanceValueState } from '../lib/reactivity/createInstanceValueState.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import { createSharedNodeState, type SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import type { SimpleAtomicState } from '../lib/reactivity/types.ts';
import type { RootAttributeDefinition } from '../parse/model/RootAttributeDefinition.ts';
import type { DescendantNodeSharedStateSpec } from './abstract/DescendantNode.ts';
import { InstanceNode } from './abstract/InstanceNode.ts';
import type { AnyNode } from './hierarchy.ts';
import type { DecodeInstanceValue, InstanceValueContext } from './internal-api/InstanceValueContext.ts';
import type { ClientReactiveSerializableAttributeNode } from './internal-api/serialization/ClientReactiveSerializableAttributeNode.ts';
import type { Root } from './Root.ts';

export interface AttributeStateSpec<RuntimeValue> extends DescendantNodeSharedStateSpec {
	readonly children: null;
	readonly value: SimpleAtomicState<RuntimeValue>;
	readonly instanceValue: Accessor<string>;
	readonly label: null;
	readonly hint: null;
	readonly valueOptions: null;
}

export class Attribute
	extends InstanceNode<RootAttributeDefinition, AttributeStateSpec<RuntimeValue<'string'>>, AnyNode, null>
	// extends ValueNode<'string', RootAttributeDefinition, RuntimeValue<'string'>, RuntimeInputValue<'string'>>
	implements AttributeNode, ClientReactiveSerializableAttributeNode, InstanceValueContext, XFormsXPathAttribute
{
	override readonly [XPathNodeKindKey] = 'attribute';

	// InstanceNode
	protected readonly state: SharedNodeState<AttributeStateSpec<string>>;
	protected readonly engineState: EngineState<AttributeStateSpec<string>>;
	readonly validationState: LeafNodeValidationState;
	
	// ValueNode
	readonly nodeType = 'attribute';
	readonly currentState: CurrentState<AttributeStateSpec<string>>;
	override readonly instanceState: InstanceState;

	readonly appearances = null;
	readonly nodeOptions = null;

	readonly valueType: string;
	readonly decodeInstanceValue: DecodeInstanceValue;

	protected readonly getInstanceValue: Accessor<string>;
	protected readonly valueState: RuntimeValueState<RuntimeValue<'string'>>;
	protected readonly setValueState: RuntimeValueSetter<RuntimeInputValue<'string'>>;
	readonly evaluator: EngineXPathEvaluator;
	readonly getActiveLanguage: Accessor<ActiveLanguage>;

	override readonly root: Root;

	readonly isRelevant: Accessor<boolean> = () => {
		return this.parent.isRelevant();
	};

	readonly isAttached: Accessor<boolean> = () => {
		return this.parent.isAttached();
	};

	readonly isReadonly: Accessor<boolean> = () => {
		return true;
	};

	readonly hasReadonlyAncestor: Accessor<boolean> = () => {
		const { parent } = this;

		return parent.hasReadonlyAncestor() || parent.isReadonly();
	};

	readonly hasNonRelevantAncestor: Accessor<boolean> = () => {
		const { parent } = this;

		return parent.hasNonRelevantAncestor() || !parent.isRelevant();
	};


	constructor(
		owner: AnyNode,
		definition: RootAttributeDefinition,
		override readonly instanceNode: StaticLeafElement
	) {

		const codec = getSharedValueCodec('string');
		
		super(owner.instanceConfig, owner, instanceNode, definition, { scope: owner.scope });

		this.root = owner.root;

		this.getActiveLanguage = owner.getActiveLanguage;

		// TODO null validation state
		this.validationState = {
			violation: null,
			constraint: {
				condition: 'constraint',
				valid: true,
				message: null
			},
			required: {
				condition: 'required',
				valid: true,
				message: null
			},
		};

		// const getInstanceValue = this.getInstanceValue;

		this.valueType = 'string';
		this.evaluator = owner.evaluator;
		this.decodeInstanceValue = codec.decodeInstanceValue;

		const instanceValueState = createInstanceValueState(this);
		const valueState = codec.createRuntimeValueState(instanceValueState);

		const [getInstanceValue] = instanceValueState;
		const [, setValueState] = valueState;

		this.getInstanceValue = getInstanceValue;
		this.setValueState = setValueState;
		this.getXPathValue = () => {
			return this.getInstanceValue();
		};
		this.valueState = valueState;
		// this.validation = createValidationState(this, this.instanceConfig);
		// this.instanceState = createAttributeNodeInstanceState(this);

		const state = createSharedNodeState(
			this.scope,
			{
				reference: () => `${owner.contextReference()}/${definition.qualifiedName.getPrefixedName()}`, // TODO use this.computeChildStepReference from InstanceNode!
				readonly: this.isReadonly,
				relevant: this.isRelevant,
				required: () => false,

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

	getChildren(): readonly [] {
		return [];
	}
}
