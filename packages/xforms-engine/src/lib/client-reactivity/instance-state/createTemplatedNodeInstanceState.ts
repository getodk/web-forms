import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
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


			const attributes = node.currentState.attributes.map((attribute) => {
				return { serializeAttributeXML: () => attribute.instanceState.instanceXML };
			});

			return serializeParentElementXML(node.definition.qualifiedName, serializedChildren, { attributes });
		},
	};
};
