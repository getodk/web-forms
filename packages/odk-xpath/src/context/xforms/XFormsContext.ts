import { XFORMS_NAMESPACE_URI, XHTML_NAMESPACE_URI } from '../../evaluator/NamespaceResolver';
import { UpsertableWeakMap } from '../../lib/collections/UpsertableWeakMap.ts';
import { XFormsSecondaryInstanceMap } from './XFormsSecondaryInstanceMap.ts';
import { XFormsTranslations } from './XFormsTranslations.ts';

const xformsContexts = new UpsertableWeakMap<Node, XFormsContext | null>();

export class XFormsContext {
	static from(node: Node): XFormsContext | null {
		return xformsContexts.upsert(node, () => {
			const document =
				node.nodeType === Node.DOCUMENT_NODE
					? (node as Document)
					: // TODO: ... shouldn't this non-null assertion at least lint error...?
					  node.ownerDocument!;
			const { documentElement } = document;
			const { localName, namespaceURI } = documentElement;

			if (namespaceURI !== XHTML_NAMESPACE_URI || localName !== 'html') {
				return null;
			}

			const model = documentElement.querySelector(':scope > head > model');

			if (model == null || model.namespaceURI !== XFORMS_NAMESPACE_URI) {
				return null;
			}

			return new this(model);
		});
	}

	readonly secondaryInstances: XFormsSecondaryInstanceMap;
	readonly translations: XFormsTranslations;

	protected constructor(model: Element) {
		this.secondaryInstances = XFormsSecondaryInstanceMap.from(model);
		this.translations = XFormsTranslations.from(model);
	}
}
