import type { XFormsNamespaceURI } from '../../evaluator/NamespaceResolver.ts';
import { XFORMS_NAMESPACE_URI } from '../../evaluator/NamespaceResolver.ts';
import { UpsertableWeakMap } from '../../lib/collections/UpsertableWeakMap.ts';

type InstanceID = string;

export interface SecondaryInstanceElement extends Element {
	readonly id: string;
	readonly localName: 'instance';
	readonly namespaceURI: XFormsNamespaceURI;
}

const isSecondaryInstanceElement = (element: Element): element is SecondaryInstanceElement => {
	const { id, localName, namespaceURI } = element;

	return (
		namespaceURI === XFORMS_NAMESPACE_URI && localName === 'instance' && id != null && id !== ''
	);
};

const secondaryInstanceMaps = new UpsertableWeakMap<Element, XFormsSecondaryInstanceMap>();

export class XFormsSecondaryInstanceMap extends Map<InstanceID, Element> {
	static from(model: Element): XFormsSecondaryInstanceMap {
		return secondaryInstanceMaps.upsert(model, () => {
			const instanceElements = Array.from(model.children).filter(isSecondaryInstanceElement);

			return new this(instanceElements.map((element) => [element.id, element]));
		});
	}

	protected constructor(entries: Iterable<readonly [InstanceID, SecondaryInstanceElement]>) {
		super(entries);
	}
}
