import type { StaticDocument } from '../../integration/xpath/static-dom/StaticDocument.ts';
import type { StaticElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import {
	parseStaticDocumentFromDOMSubtree,
	type ConcreteStaticDocumentConstructor,
	type StaticElementConstructor,
} from './parseStaticDocumentFromDOMSubtree.ts';

export const parseStaticDocumentFromXML = <
	T extends StaticDocument<Root>,
	Root extends StaticElement<T>,
>(
	DocumentConstructor: ConcreteStaticDocumentConstructor<T, Root>,
	DocumentRootConstructor: StaticElementConstructor<Root, T>,
	xml: string
): StaticDocument<Root> => {
	const parser = new DOMParser();
	const xmlDocument = parser.parseFromString(xml, 'text/xml');

	return parseStaticDocumentFromDOMSubtree(
		DocumentConstructor,
		DocumentRootConstructor,
		xmlDocument.documentElement
	);
};
