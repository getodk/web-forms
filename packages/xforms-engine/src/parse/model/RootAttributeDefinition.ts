import { XMLNS_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import type { StaticAttribute } from '../../integration/xpath/static-dom/StaticAttribute.ts';
import {
	NamespaceDeclarationMap,
	type NamedNodeDefinition,
} from '../../lib/names/NamespaceDeclarationMap.ts';
import { QualifiedName } from '../../lib/names/QualifiedName.ts';
import { escapeXMLText } from '../../lib/xml-serialization.ts';
import type { BindDefinition } from './BindDefinition.ts';
import { NodeDefinition } from './NodeDefinition.ts';
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
export class RootAttributeDefinition
	extends NodeDefinition<'attribute'>
	implements NamedNodeDefinition
{
	private readonly serializedXML: string;

	readonly value: string;
	readonly type = 'attribute';
	readonly namespaceDeclarations: NamespaceDeclarationMap;
	readonly bodyElement = null;
	readonly root: RootDefinition;
	readonly isTranslated: boolean = false;
	readonly parent = null;
	readonly children = null;
	readonly attributes = null;

	readonly qualifiedName: QualifiedName;

	constructor(
		root: RootDefinition,
		source: RootAttributeSource,
		bind: BindDefinition,
		readonly template: StaticAttribute
	) {
		super(bind);

		const { value } = source;

		this.root = root;

		this.value = value;
		this.qualifiedName = source.qualifiedName;
		this.namespaceDeclarations = new NamespaceDeclarationMap(this);

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
