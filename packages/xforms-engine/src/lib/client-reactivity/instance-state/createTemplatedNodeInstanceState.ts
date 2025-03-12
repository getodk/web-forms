import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import { TemplatedNodeSerializationError } from '../../../error/TemplatedNodeSerializationError.ts';
import type { ClientReactiveSerializableTemplatedNode } from '../../../instance/internal-api/serialization/ClientReactiveSerializableTemplatedNode.ts';
import { serializeParentElementXML } from '../../xml-serialization.ts';

export const createTemplatedNodeInstanceState = (
	node: ClientReactiveSerializableTemplatedNode
): InstanceState => {
	return {
		get instanceXML() {
			if (!node.currentState.relevant) {
				return '';
			}

			const serializedChildren = node.currentState.children.map((child) => {
				return child.instanceState.instanceXML;
			});

			const { attributes } = node.currentState;

			if (attributes != null) {
				throw new TemplatedNodeSerializationError(
					TemplatedNodeSerializationError.MESSAGES.TEMPLATE_ATTRIBUTE_OMISSION_NOT_IMPLEMENTED
				);
			}

			return serializeParentElementXML(node.definition.qualifiedName, serializedChildren);
		},
	};
};
