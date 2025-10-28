import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import type { QualifiedName } from '../../../lib/names/QualifiedName.ts';
import type {
	ClientReactiveSerializableChildNode,
	ClientReactiveSerializableParentNode,
} from './ClientReactiveSerializableParentNode.ts';

export type SerializedInstanceValue = string;

interface ClientReactiveSerializableValueNodeCurrentState {
	get relevant(): boolean;

	/**
	 * @todo Consider moving into {@link InstanceState}
	 */
	get instanceValue(): SerializedInstanceValue;

	// TODO specify type, either RootAttributeDefinition, or SerializableElementAttribute, or similar
	// TODO probably should be in different interface - we're going to need it elsewhere
	get attributes(): [];
}

interface ClientReactiveSerializableValueNodeDefinition {
	readonly qualifiedName: QualifiedName;
}

export interface ClientReactiveSerializableValueNode {
	readonly definition: ClientReactiveSerializableValueNodeDefinition;
	readonly parent: ClientReactiveSerializableParentNode<ClientReactiveSerializableChildNode>;
	readonly currentState: ClientReactiveSerializableValueNodeCurrentState;
	readonly instanceState: InstanceState;
}
