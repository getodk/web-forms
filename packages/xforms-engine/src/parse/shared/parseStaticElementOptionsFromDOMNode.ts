import type { StaticAttributeOptions } from '../../integration/xpath/static-dom/StaticAttribute.ts';
import type { StaticElementOptions } from '../../integration/xpath/static-dom/StaticElement.ts';
import type { QualifiedNameSource } from '../../lib/names/QualifiedName.ts';

const parseNodeName = (domNode: Attr | Element): QualifiedNameSource => {
	return {
		namespaceURI: domNode.namespaceURI,
		prefix: domNode.prefix,
		localName: domNode.localName,
	};
};

interface ParsedDOMSourceStaticAttribute extends StaticAttributeOptions {
	readonly name: QualifiedNameSource;
}

const parseStaticElementAttributes = (
	domElement: Element
): readonly ParsedDOMSourceStaticAttribute[] => {
	return Array.from(domElement.attributes).map((attr) => ({
		name: attr,
		value: attr.value,
	}));
};

const { ELEMENT_NODE, CDATA_SECTION_NODE, TEXT_NODE } = Node;

interface DOMSourceParseOptions {
	/**
	 * NOTE: this is an option to `parseStaticElementOptionsFromDOMNode` so it can
	 * be applied recursively, from the children of the input DOM `Element`
	 * through all of its descendant elements.
	 */
	readonly omitTextNodes: boolean;
}

const parseStaticElementChildren = (
	domElement: Element,
	options: DOMSourceParseOptions
): readonly DOMSourceStaticElementChildOption[] => {
	return Array.from(domElement.childNodes).flatMap((child) => {
		switch (child.nodeType) {
			case ELEMENT_NODE:
				return parseStaticElementOptionsFromDOMNode(child as Element);

			case TEXT_NODE:
			case CDATA_SECTION_NODE:
				if (options.omitTextNodes) {
					return [];
				}

				return (child as CharacterData).data;

			default:
				return [];
		}
	});
};

type DOMSourceStaticElementChildOption = ParsedDOMSourceStaticElement | string;

interface ParsedDOMSourceStaticElement extends StaticElementOptions {
	readonly name: QualifiedNameSource;
	readonly attributes: readonly ParsedDOMSourceStaticAttribute[];
	readonly children: readonly DOMSourceStaticElementChildOption[];
}

export const parseStaticElementOptionsFromDOMNode = (
	domElement: Element,
	options: DOMSourceParseOptions = { omitTextNodes: false }
): ParsedDOMSourceStaticElement => {
	return {
		name: parseNodeName(domElement),
		attributes: parseStaticElementAttributes(domElement),
		children: parseStaticElementChildren(domElement, options),
	};
};
