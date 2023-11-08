import type { Temporal } from '@js-temporal/polyfill';
import type { Evaluator } from '../evaluator/Evaluator.ts';
import type { FunctionLibraryCollection } from '../evaluator/functions/FunctionLibraryCollection.ts';
import type { ContextDocument, ContextNode, ContextParentNode } from '../lib/dom/types.ts';
import type { XPathNamespaceResolverObject } from '../shared/interface.ts';
import type { XFormsContext } from './xforms/XFormsContext.ts';

/**
 * The context in which any XPath expression *or sub-expression* is evaluated.
 */
export interface Context {
	// The evaluator itself acts as the containing context, and will provide
	// several aspects of the context's own environment.
	readonly evaluator: Evaluator;

	readonly evaluationContextNode: ContextNode;
	readonly currentLanguage: string | null;

	readonly contextDocument: ContextDocument;
	readonly rootNode: ContextParentNode;
	readonly contextNodes: Iterable<ContextNode>;

	contextPosition(): number;
	contextSize(): number;

	readonly functions: FunctionLibraryCollection;
	readonly namespaceResolver: XPathNamespaceResolverObject;
	readonly timeZone: Temporal.TimeZone;

	// TODO: eventually we may break apart XPath 1.0 functionality from XForms
	// extensions etc. This is nullable and no XPath 1.0 functionality depends on
	// it, but it also isn't great that it's a prominent part of the primary
	// context interface either. It's worth considering a more general way for
	// extensions to provide arbitrary context to e.g. support their function
	// libraries.
	readonly xformsContext: XFormsContext | null;
}
