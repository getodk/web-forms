import { XMLNS_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import type { NamedNodeDefinition } from '../../lib/names/NamespaceDeclarationMap.ts';
import { QualifiedName } from '../../lib/names/QualifiedName.ts';
import { escapeXMLText } from '../../lib/xml-serialization.ts';
import type { BindDefinition } from './BindDefinition.ts';
import { LeafNodeDefinition } from './LeafNodeDefinition.ts';
import type { RootDefinition } from './RootDefinition.ts';

interface RootAttributeSource {
	readonly qualifiedName: QualifiedName;
	readonly value: string;
}

/**
 * @todo This class is named and typed to emphasize its intentionally narrow
 * usage and purpose. It **intentionally** avoids addressing the much broader
 * set of concerns around modeling attributes in primary instance/submissions.
 */
export class RootAttributeDefinition extends LeafNodeDefinition<'string'> implements NamedNodeDefinition {
	private readonly serializedXML: string;

	readonly value: string;

	constructor(root: RootDefinition, source: RootAttributeSource, bind: BindDefinition) {

		super(root, bind, null, source);

		const { value } = source;

		this.value = value;

		// We serialize namespace declarations separately
		// TODO I guess don't do it here?
		if (this.qualifiedName.namespaceURI?.href === XMLNS_NAMESPACE_URI) {
			this.serializedXML = '';
		} else {
			const nodeName = this.qualifiedName.getPrefixedName();

			this.serializedXML = ` ${nodeName}="${escapeXMLText(value, true)}"`;
		}
	}

	serializeAttributeXML(): string {
		return this.serializedXML;
	}
}
