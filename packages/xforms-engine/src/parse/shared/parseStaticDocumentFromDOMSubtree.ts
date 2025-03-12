import { StaticDocument } from '../../integration/xpath/static-dom/StaticDocument.ts';
import { parseStaticElementOptionsFromDOMNode } from './parseStaticElementOptionsFromDOMNode.ts';

export const parseStaticDocumentFromDOMSubtree = (subtreeRootElement: Element): StaticDocument => {
	const documentRoot = parseStaticElementOptionsFromDOMNode(subtreeRootElement);

	return new StaticDocument({
		documentRoot,
	});
};
