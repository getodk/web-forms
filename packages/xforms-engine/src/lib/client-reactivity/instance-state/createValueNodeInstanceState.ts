import { Temporal } from 'temporal-polyfill';
import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import type { ClientReactiveSerializableValueNode } from '../../../instance/internal-api/serialization/ClientReactiveSerializableValueNode.ts';
import { escapeXMLText, serializeLeafElementXML } from '../../xml-serialization.ts';

const getValue = (node: ClientReactiveSerializableValueNode): string => {
	const preload = node.definition.bind.preload;
	if (preload) {
		if (preload.type === 'timestamp' && preload.parameter === 'end') {
			return Temporal.Now.instant().toString();
		}
	}

	return escapeXMLText(node.currentState.instanceValue);
};

export const createValueNodeInstanceState = (
	node: ClientReactiveSerializableValueNode
): InstanceState => {
	const { qualifiedName } = node.definition;

	return {
		get instanceXML() {
			if (!node.currentState.relevant) {
				return '';
			}

			const value = getValue(node);
			const xmlValue = escapeXMLText(value);
			const attributes = node.currentState.attributes;

			return serializeLeafElementXML(qualifiedName, xmlValue, attributes);
		},
	};
};
