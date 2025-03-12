import type { StaticElement } from '../../../integration/xpath/static-dom/StaticElement.ts';
import type { GeneralChildNode } from '../../hierarchy.ts';
import type {
	ClientReactiveSerializableParentNode,
	ClientReactiveSerializableParentNodeCurrentState,
	ClientReactiveSerializableParentNodeDefinition,
} from './ClientReactiveSerializableParentNode.ts';

export interface ClientReactiveSerializableTemplatedNodeCurrentState
	extends ClientReactiveSerializableParentNodeCurrentState<GeneralChildNode> {
	get attributes(): unknown;
}

export interface ClientReactiveSerializableTemplatedNodeDefinition
	extends ClientReactiveSerializableParentNodeDefinition {
	readonly template: StaticElement;
}

export interface ClientReactiveSerializableTemplatedNode
	extends ClientReactiveSerializableParentNode<GeneralChildNode> {
	readonly currentState: ClientReactiveSerializableTemplatedNodeCurrentState;
}
