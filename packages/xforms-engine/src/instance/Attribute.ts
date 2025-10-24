import { XPathNodeKindKey } from '@getodk/xpath';
import type { AttributeNode, AttributeNodeState } from '../client/AttributeNode.ts';
import type { InstanceState } from '../client/index.ts';
import type { StaticLeafElement } from '../integration/xpath/static-dom/StaticElement.ts';
import type { RootAttributeDefinition } from '../parse/model/RootAttributeDefinition.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { Root } from './Root.ts';


export class Attribute
	implements
		AttributeNode
{

	// XFormsXPathElement
	readonly [XPathNodeKindKey] = 'attribute';
	readonly definition: RootAttributeDefinition;

	// // InstanceNode
	// protected readonly state: SharedNodeState<InputControlStateSpec<V>>;
	// protected readonly engineState: EngineState<InputControlStateSpec<V>>;

	// // InputNode
	readonly nodeType = 'attribute';
	readonly root: Root;
	readonly parent: GeneralParentNode;
	readonly currentState: AttributeNodeState;
	readonly instanceState: InstanceState;

	// readonly appearances: InputNodeAppearances;
	// readonly nodeOptions: InputNodeOptions<V>;
	// readonly currentState: CurrentState<InputControlStateSpec<V>>;

	constructor(
		parent: GeneralParentNode,
		instanceNode: StaticLeafElement | null,
		definition: RootAttributeDefinition
	) {
		this.definition = definition;
		this.root = parent.root;
		this.parent = parent;
		this.currentState = null;
		this.instanceState = null;
		// const codec = getSharedValueCodec(definition.valueType);


		// this.appearances = definition.bodyElement.appearances;
		// this.nodeOptions = nodeOptionsFactoryByType[definition.valueType](definition.bodyElement);

		// const state = createSharedNodeState(
		// 	this.scope,
		// 	{
		// 		reference: this.contextReference,
		// 		readonly: this.isReadonly,
		// 		relevant: this.isRelevant,
		// 		required: this.isRequired,

		// 		label: createNodeLabel(this, definition),
		// 		hint: createFieldHint(this, definition),
		// 		children: null,
		// 		valueOptions: null,
		// 		value: this.valueState,
		// 		instanceValue: this.getInstanceValue,
		// 		attributes: this.getAttributes
		// 	},
		// 	this.instanceConfig
		// );

		// this.state = state;
		// this.engineState = state.engineState;
		// this.currentState = state.currentState;
	}
	// nodeType: InstanceNodeType;
	// root: BaseNode;
	// parent: unknown;
	// currentState: AttributeNodeState;
	// instanceState: InstanceState;

	// setValue(value: InputNodeInputValue<V>): Root {
	// 	this.setValueState(value);

	// 	return this.root;
	// }
}
