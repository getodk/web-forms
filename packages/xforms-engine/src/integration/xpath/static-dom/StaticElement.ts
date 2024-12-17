import { XFORMS_KNOWN_ATTRIBUTE, XFORMS_LOCAL_NAME, XPathNodeKindKey } from '@getodk/xpath';
import type { EngineDOMAdapter } from '../adapter/engineDOMAdapter.ts';
import type { XFormsXPathElement } from '../adapter/XFormsXPathNode.ts';
import { StaticAttribute } from './StaticAttribute.ts';
import type { StaticNamedNodeOptions } from './StaticNamedNode.ts';
import { StaticNamedNode } from './StaticNamedNode.ts';
import type { StaticChildNode, StaticParentNode } from './StaticNode.ts';

export type StaticElementAttributesFactory = (element: StaticElement) => readonly StaticAttribute[];

export type StaticElementChildNodesFactory = (element: StaticElement) => readonly StaticChildNode[];

export interface StaticElementOptions extends StaticNamedNodeOptions {}

type StaticElementKnownAttributeValue<
	T extends StaticElement,
	LocalName extends string,
> = T extends { readonly [XFORMS_KNOWN_ATTRIBUTE]: LocalName } ? string : string | null;

type AssertStaticElementKnownAttributeValue = <T extends StaticElement, LocalName extends string>(
	element: T,
	localName: LocalName,
	value: string | null
) => asserts value is StaticElementKnownAttributeValue<T, LocalName>;

const assertStaticElementKnownAttributeValue: AssertStaticElementKnownAttributeValue = (
	element,
	localName,
	value
) => {
	if (localName === element[XFORMS_KNOWN_ATTRIBUTE] && value == null) {
		throw new Error(`Expected attribute: ${element[XFORMS_KNOWN_ATTRIBUTE]}`);
	}
};

export class StaticElement<Parent extends StaticParentNode = StaticParentNode>
	extends StaticNamedNode<'element'>
	implements XFormsXPathElement
{
	readonly [XFORMS_LOCAL_NAME]?: string;
	readonly [XFORMS_KNOWN_ATTRIBUTE]?: string;

	readonly [XPathNodeKindKey] = 'element';
	readonly nodeType = 'static-element';
	readonly root: StaticElement;
	readonly attributes: readonly StaticAttribute[];
	readonly children: readonly StaticChildNode[];

	constructor(
		parent: Parent,
		attributesFactory: StaticElementAttributesFactory,
		childNodesFactory: StaticElementChildNodesFactory,
		options: StaticElementOptions
	) {
		super(parent, options);

		// Account for the fact that we may be constructing the document root!
		if (parent === this.rootDocument) {
			this.root = this;
		} else {
			this.root = parent.root;
		}

		this.attributes = attributesFactory(this);
		this.children = childNodesFactory(this);
	}

	/**
	 * @todo Generalize this, incorporate into {@link EngineDOMAdapter}
	 * @todo Namespaced lookup
	 * @todo Optimize: lookup from map and/or caching
	 */
	protected getAttributeNode(localName: string): StaticAttribute | null {
		return (
			this.attributes.find((attribute) => {
				return attribute.localName === localName;
			}) ?? null
		);
	}

	/**
	 * @todo Generalize this, incorporate into {@link EngineDOMAdapter}
	 * @todo Namespaced lookup
	 * @todo Optimize: lookup from map and/or caching (especially asserting known
	 * attributes!)
	 * @todo As long as this depends on {@link getAttributeNode}, push assertion
	 * up. (This was put off because the types are already plenty complex as it
	 * is.)
	 */
	getAttributeValue<This extends StaticElement, LocalName extends string>(
		this: This,
		localName: LocalName
	): StaticElementKnownAttributeValue<This, LocalName> {
		const attribute = this.getAttributeNode(localName);
		const value = attribute?.value ?? null;

		assertStaticElementKnownAttributeValue(this, localName, value);

		return value;
	}

	// XFormsXPathElement
	getXPathValue(): string {
		return this.children.map((child) => child.getXPathValue()).join('');
	}
}
