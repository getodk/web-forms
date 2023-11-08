import { Temporal } from '@js-temporal/polyfill';
import { LocationPathEvaluation } from '../evaluations/LocationPathEvaluation.ts';
import type { Evaluator } from '../evaluator/Evaluator.ts';
import { NamespaceResolver } from '../evaluator/NamespaceResolver.ts';
import type { FunctionLibraryCollection } from '../evaluator/functions/FunctionLibraryCollection.ts';
import type { FilteredTreeWalker, FilteredTreeWalkers } from '../lib/dom/traversal.ts';
import { getDocument, getRootNode, getTreeWalker } from '../lib/dom/traversal.ts';
import type { ContextDocument, ContextNode, ContextParentNode } from '../lib/dom/types.ts';
import type { XPathNamespaceResolverObject } from '../shared/interface.ts';
import type { Context } from './Context.ts';
import type { XFormsContext } from './xforms/XFormsContext.ts';

class EvaluationContextTreeWalkers implements FilteredTreeWalkers {
	readonly ANY: FilteredTreeWalker<'ANY'>;
	readonly COMMENT: FilteredTreeWalker<'COMMENT'>;
	readonly ELEMENT: FilteredTreeWalker<'ELEMENT'>;
	readonly PROCESSING_INSTRUCTION: FilteredTreeWalker<'PROCESSING_INSTRUCTION'>;
	readonly TEXT: FilteredTreeWalker<'TEXT'>;

	constructor(contextDocument: ContextDocument, rootNode: ContextParentNode) {
		this.ANY = getTreeWalker(contextDocument, rootNode, 'ANY');
		this.COMMENT = getTreeWalker(contextDocument, rootNode, 'COMMENT');
		this.ELEMENT = getTreeWalker(contextDocument, rootNode, 'ELEMENT');
		this.PROCESSING_INSTRUCTION = getTreeWalker(
			contextDocument,
			rootNode,
			'PROCESSING_INSTRUCTION'
		);
		this.TEXT = getTreeWalker(contextDocument, rootNode, 'TEXT');
	}
}

export type { EvaluationContextTreeWalkers };

export interface EvaluationContextOptions {
	readonly document: ContextDocument;
	readonly rootNode: ContextParentNode;
	readonly functions: FunctionLibraryCollection;
	readonly namespaceResolver: XPathNamespaceResolverObject;
	readonly timeZone: Temporal.TimeZone;
	readonly treeWalkers: EvaluationContextTreeWalkers;
	readonly xformsContext: XFormsContext | null;
}

/**
 * The context in which an XPath expression (**not** a sub-expression)
 * is evaluated.
 */
export class EvaluationContext implements Context {
	readonly evaluationContextNode: ContextNode;

	readonly contextDocument: ContextDocument;
	readonly rootNode: ContextParentNode;

	readonly contextNodes: Iterable<ContextNode>;

	readonly functions: FunctionLibraryCollection;
	readonly namespaceResolver: XPathNamespaceResolverObject;

	readonly timeZone: Temporal.TimeZone;

	readonly treeWalkers: EvaluationContextTreeWalkers;

	readonly xformsContext: XFormsContext | null;

	get currentLanguage(): string | null {
		return this.evaluator.getCurrentLanguage();
	}

	constructor(
		readonly evaluator: Evaluator,
		contextNode: ContextNode,
		options: Partial<EvaluationContextOptions> = {}
	) {
		this.evaluationContextNode = contextNode;

		const {
			rootNode = getRootNode(contextNode),
			document = getDocument(rootNode),
			functions = evaluator.functions,
			namespaceResolver = new NamespaceResolver(document, contextNode),
			treeWalkers = new EvaluationContextTreeWalkers(document, rootNode),
			timeZone = evaluator.timeZone,
			xformsContext = null,
		} = options;

		this.contextDocument = document;
		this.contextNodes = [contextNode];
		this.rootNode = rootNode;
		this.functions = functions;
		this.namespaceResolver = namespaceResolver;
		this.treeWalkers = treeWalkers;
		this.timeZone = timeZone;
		this.xformsContext = xformsContext;
	}

	contextPosition(): number {
		return 1;
	}

	contextSize(): number {
		return 1;
	}

	currentContext(): LocationPathEvaluation {
		return LocationPathEvaluation.fromCurrentContext(this);
	}

	rootContext(): LocationPathEvaluation {
		return LocationPathEvaluation.fromRoot(this);
	}
}
