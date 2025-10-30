import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import type { Root } from '../../../instance/Root.ts';
import { serializeParentElementXML } from '../../xml-serialization.ts';

export const createRootInstanceState = (node: Root): InstanceState => {
	return {
		get instanceXML() {
			const { namespaceDeclarations } = node.definition;

			// TODO this is very common to createParentNodeInstanceState - find a way to reuse
			const serializedChildren = node.currentState.children.map((child) => {
				return child.instanceState.instanceXML;
			});
			const attributes = node.currentState.attributes.map((attribute) => {
				return { serializeAttributeXML: () => attribute.instanceState.instanceXML };
			});

			return serializeParentElementXML(node.definition.qualifiedName, serializedChildren, {
				namespaceDeclarations,
				attributes
			});
		},
	};
};
