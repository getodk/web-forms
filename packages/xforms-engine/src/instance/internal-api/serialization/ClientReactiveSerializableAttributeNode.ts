import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import type { QualifiedName } from '../../../lib/names/QualifiedName.ts';
import type {
	ClientReactiveSerializableChildNode,
	ClientReactiveSerializableParentNode,
} from './ClientReactiveSerializableParentNode.ts';

export type SerializedInstanceValue = string;

interface ClientReactiveSerializableAttributeNodeCurrentState {
	get relevant(): boolean;

	/**
	 * @todo Consider moving into {@link InstanceState}
	 */
	get instanceValue(): SerializedInstanceValue;
}

interface ClientReactiveSerializableAttributeNodeDefinition {
	readonly qualifiedName: QualifiedName;
}

export interface ClientReactiveSerializableAttributeNode {
	readonly definition: ClientReactiveSerializableAttributeNodeDefinition;
	readonly parent: ClientReactiveSerializableParentNode<ClientReactiveSerializableChildNode>;
	readonly currentState: ClientReactiveSerializableAttributeNodeCurrentState;
	readonly instanceState: InstanceState;
}
