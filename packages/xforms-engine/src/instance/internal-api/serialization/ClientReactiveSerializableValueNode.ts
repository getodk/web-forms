import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import type { QualifiedName } from '../../../lib/names/QualifiedName.ts';
import type { Attribute } from '../../Attribute.ts';
import type {
	ClientReactiveSerializableChildNode,
	ClientReactiveSerializableParentNode,
} from './ClientReactiveSerializableParentNode.ts';

export type SerializedInstanceValue = string;

interface ClientReactiveSerializableValueNodeCurrentState {
	get relevant(): boolean;

	/**
	 * @todo Consider moving BOTH into {@link InstanceState}
	 */
	get instanceValue(): SerializedInstanceValue;
	get attributes(): readonly Attribute[];
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
