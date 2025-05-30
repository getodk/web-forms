import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { Temporal } from 'temporal-polyfill';
import type { XPathDOMAdapter } from '../adapter/interface/XPathDOMAdapter.ts';
import type {
	UnspecifiedNonXPathNodeKind,
	XPathAttribute,
	XPathNamespaceDeclaration,
	XPathNode,
	XPathNodeKind,
} from '../adapter/interface/XPathNode.ts';
import type {
	AdapterDocument,
	AdapterParentNode,
} from '../adapter/interface/XPathNodeKindAdapter.ts';
import type { XPathDOMProvider } from '../adapter/xpathDOMProvider.ts';
import type { Context } from '../context/Context.ts';
import type { EvaluationContext } from '../context/EvaluationContext.ts';
import type { Evaluator } from '../evaluator/Evaluator.ts';
import type { NamespaceResolver } from '../evaluator/NamespaceResolver.ts';
import type { FilterPathExpressionEvaluator } from '../evaluator/expression/FilterPathExpressionEvaluator.ts';
import type { LocationPathEvaluator } from '../evaluator/expression/LocationPathEvaluator.ts';
import type { LocationPathExpressionEvaluator } from '../evaluator/expression/LocationPathExpressionEvaluator.ts';
import type { FunctionLibraryCollection } from '../evaluator/functions/FunctionLibraryCollection.ts';
import type { NodeSetFunction } from '../evaluator/functions/NodeSetFunction.ts';
import type { AnyStep } from '../evaluator/step/Step.ts';
import type { Evaluation } from './Evaluation.ts';
import { NodeEvaluation } from './NodeEvaluation.ts';

// prettier-ignore
type LocationPathParentContext<T extends XPathNode> =
	| EvaluationContext<T>
	| LocationPathEvaluation<T>;

type EvaluationComparator<T extends XPathNode> = (
	lhs: Evaluation<T>,
	rhs: Evaluation<T>
) => boolean;

type NodeTypePredicate<T extends XPathNode> = (node: T) => boolean;

const anyNodeTypePredicate = <T extends XPathNode>(_: T): true => true;

const getNodeTypePredicate = <T extends XPathNode>(
	domProvider: XPathDOMProvider<T>,
	step: AnyStep
): NodeTypePredicate<T> => {
	switch (step.axisType) {
		case 'attribute':
			return domProvider.isAttribute;

		case 'namespace':
			return domProvider.isNamespaceDeclaration;

		default:
			break;
	}

	switch (step.nodeType) {
		case '__NAMED__':
			return domProvider.isQualifiedNamedNode;

		case 'processing-instruction':
			return domProvider.isProcessingInstruction;

		case 'comment':
			return domProvider.isComment;

		case 'node':
			return anyNodeTypePredicate<T>;

		case 'text':
			return domProvider.isText;

		default:
			throw new UnreachableError(step);
	}
};

interface AxisEvaluationCurrentContext<T extends XPathNode> {
	readonly domProvider: XPathDOMProvider<T>;
	readonly contextDocument: AdapterDocument<T>;
	readonly rootNode: AdapterParentNode<T>;
	readonly visited: WeakSet<T>;
}

interface AxisEvaluationContext<T extends XPathNode> extends AxisEvaluationCurrentContext<T> {
	readonly contextNode: T;
}

const axisEvaluationContext = <T extends XPathNode>(
	currentContext: AxisEvaluationCurrentContext<T>,
	contextNode: T
): AxisEvaluationContext<T> => {
	const { domProvider, contextDocument, rootNode, visited } = currentContext;

	return {
		domProvider,
		contextDocument,
		rootNode,
		contextNode,
		visited,
	};
};

type SiblingMethodName =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| 'getPreviousSiblingNode'
	| 'getPreviousSiblingElement'
	| 'getNextSiblingNode'
	| 'getNextSiblingElement';

const siblings = <T extends XPathNode>(
	context: AxisEvaluationContext<T>,
	methodName: SiblingMethodName
): readonly T[] => {
	const method = context.domProvider[methodName];
	const results: T[] = [];

	let currentNode: T | null = context.contextNode;

	while (currentNode != null) {
		currentNode = method(currentNode);

		if (currentNode != null) {
			results.push(currentNode);
		}
	}

	return results;
};

/**
 * Addresses a nuance of XPath DOM tree structural semantics, affecting the
 * {@link axisEvaluators.following | following} and
 * {@link axisEvaluators.preceding | preceding} axes. Since these axes exclude
 * {@link XPathNamespaceDeclaration | namespace declarations} and
 * {@link XPathAttribute | attributes}, traversal of those axes' nodes begins
 * with their **parent element** (in XPath semantic terms; "owner" element in
 * WHAT Working Group DOM terms).
 *
 * For all other XPath semantic node kinds, the provided {@link contextNode} is
 * returned.
 *
 * This function is intrinsically coupled to both axis implementations. It is
 * defined here to give an explicit name to the concept, and to host this
 * documentation.
 *
 * It is also worth clarifying that neither axis _includes_ the node returned by
 * this function. This is probably what one would expect for the `following`
 * axis: no node is ever followed by its parent in document order. But if one's
 * recall of XPath semantic nuances is rusty, it may be unintuitive (it was for
 * me!) that the namespace/attribute's parent element does not precede it. This
 * text from
 * {@link https://www.w3.org/TR/1999/REC-xpath-19991116/#axes | XPath 1.0 > 2.2 Axes}
 * is helpfully clarifying:
 *
 * > **NOTE:** The `ancestor`, `descendant`, `following`, `preceding` and `self`
 * > axes partition a document (ignoring attribute and namespace nodes): they do
 * > not overlap and together they contain all the nodes in the document.
 */
const getDocumentOrderTraversalContextNode = <T extends XPathNode>(
	domProvider: XPathDOMProvider<T>,
	contextNode: T
): T => {
	if (domProvider.isAttribute(contextNode) || domProvider.isNamespaceDeclaration(contextNode)) {
		const parentElement = domProvider.getParentNode(contextNode);

		domProvider.assertParentNode(parentElement);

		return parentElement;
	}

	return contextNode;
};

/**
 * **!!! HERE BE DRAGONS !!!**
 *
 * This behavior may…
 *
 * - … exceed the XPath 1.0 specification; which in turn may…
 * - … vary (even for the same document) between {@link domAdapter}
 *   implementations, depending on whether they opt to implement
 *   {@link UnspecifiedNonXPathNodeKind}.
 *
 * Specifically, if a {@link documentRoot | document root element} has preceding
 * siblings, adapters **MAY** produce a
 * {@link https://www.w3.org/TR/xml/#dtd | Document Type Declaration (DTD)}
 * node. As described in more detail on {@link UnspecifiedNonXPathNodeKind}:
 *
 * - Per XPath 1.0, DTD nodes are **NOT** considered XPath nodes
 * - Real world XPath implementations **DO** produce DTD nodes nonetheless
 *
 * This behavior is specifically implicated in accommodating that by traversing
 * to applicable nodes as produced by {@link domAdapter}, and then checking that
 * {@link domAdapter} does recognize the node's kind as **either**
 * {@link XPathNodeKind} or {@link UnspecifiedNonXPathNodeKind}. More
 * specifically, this is determined by calling the adapter's
 * {@link XPathDOMAdapter.getNodeKind | getNodeKind} implementation, and
 * checking that it produces a value. If the call returns null (or fails) for a
 * given node, that node will not be produced.
 *
 * @see {@link UnspecifiedNonXPathNodeKind}
 */
const documentRootPrecedingSiblings = <T extends XPathNode>(
	domAdapter: XPathDOMAdapter<T>,
	precedingContext: AxisEvaluationContext<T>,
	documentRoot: T,
	step: AnyStep
): readonly T[] => {
	const documentRootContext = axisEvaluationContext(precedingContext, documentRoot);
	const precedingSiblings = axisEvaluators['preceding-sibling'](documentRootContext, step);

	return precedingSiblings.flatMap((node) => {
		// Note: this is likely to be fallible in adapter implementations…
		try {
			if (domAdapter.getNodeKind(node) != null) {
				return node;
			}

			return [];
		} catch {
			// … and if it does fail, we should assume the node value is invalid!
			return [];
		}
	});
};

const axisEvaluators = {
	ancestor: <T extends XPathNode>(
		context: AxisEvaluationContext<T>,
		step: AnyStep
	): readonly T[] => {
		const { rootNode, contextNode } = context;

		if (contextNode === rootNode) {
			return [];
		}

		return axisEvaluators.parent(context).flatMap((parentNode) => {
			const parentContext = axisEvaluationContext(context, parentNode);

			return [...axisEvaluators.ancestor(parentContext, step), parentNode];
		});
	},

	'ancestor-or-self': <T extends XPathNode>(
		context: AxisEvaluationContext<T>,
		step: AnyStep
	): readonly T[] => {
		const { contextNode } = context;
		const isNamedStep = step.stepType !== 'NodeTypeTest';
		const currentContext = axisEvaluationContext(context, contextNode);
		const ancestors = axisEvaluators.ancestor(currentContext, step);

		if (!isNamedStep || context.domProvider.isElement(contextNode)) {
			return ancestors.concat(contextNode);
		}

		return ancestors;
	},

	attribute: <T extends XPathNode>(context: AxisEvaluationContext<T>): readonly T[] => {
		return context.domProvider.getAttributes(context.contextNode);
	},

	child: <T extends XPathNode>(context: AxisEvaluationContext<T>, step: AnyStep): readonly T[] => {
		const { contextNode, domProvider } = context;

		if (step.nodeType === '__NAMED__') {
			return domProvider.getChildElements(contextNode);
		}

		return domProvider.getChildNodes(contextNode);
	},

	descendant: <T extends XPathNode>(
		context: AxisEvaluationContext<T>,
		step: AnyStep
	): readonly T[] => {
		return axisEvaluators.child(context, step).flatMap((childNode) => {
			const childContext = axisEvaluationContext(context, childNode);

			return [childNode, ...axisEvaluators.descendant(childContext, step)];
		});
	},

	'descendant-or-self': <T extends XPathNode>(
		context: AxisEvaluationContext<T>,
		step: AnyStep
	): readonly T[] => {
		return [context.contextNode].concat(axisEvaluators.descendant(context, step));
	},

	following: <T extends XPathNode>(
		context: AxisEvaluationContext<T>,
		step: AnyStep
	): readonly T[] => {
		const { domProvider, contextDocument, rootNode } = context;
		const contextNode = getDocumentOrderTraversalContextNode(domProvider, context.contextNode);

		if (context.visited.has(contextNode)) {
			return [];
		}

		context.visited.add(contextNode);

		const parentNode = domProvider.getParentNode(contextNode);

		if (contextNode === rootNode || parentNode === contextDocument) {
			return [];
		}

		let firstChild: T | null;
		let nextSibling: T | null = null;

		if (step.nodeType === '__NAMED__') {
			firstChild = domProvider.getFirstChildElement(contextNode);
			nextSibling = domProvider.getNextSiblingElement(contextNode);
		} else {
			firstChild = domProvider.getFirstChildNode(contextNode);
			nextSibling = domProvider.getNextSiblingNode(contextNode);
		}

		let currentNodes = [firstChild, nextSibling].filter((node) => node != null);

		if (parentNode != null && parentNode !== rootNode) {
			const followingParentSiblingsContext = axisEvaluationContext(context, parentNode);
			const followingParentSiblings = axisEvaluators['following-sibling'](
				followingParentSiblingsContext,
				step
			);

			currentNodes = currentNodes.concat(followingParentSiblings);
		}

		return currentNodes.flatMap((currentNode) => {
			const currentContext = axisEvaluationContext(context, currentNode);

			return [currentNode].concat(axisEvaluators.following(currentContext, step));
		});
	},

	'following-sibling': <T extends XPathNode>(
		context: AxisEvaluationContext<T>,
		step: AnyStep
	): readonly T[] => {
		if (step.nodeType === '__NAMED__') {
			return siblings(context, 'getNextSiblingElement');
		}

		return siblings(context, 'getNextSiblingNode');
	},

	namespace: <T extends XPathNode>(context: AxisEvaluationContext<T>): readonly T[] => {
		return context.domProvider.getNamespaceDeclarations(context.contextNode);
	},

	parent: <T extends XPathNode>(context: AxisEvaluationContext<T>): readonly [] | readonly [T] => {
		const { rootNode, contextNode } = context;

		if (contextNode === rootNode) {
			return [];
		}

		const parentNode = context.domProvider.getParentNode(contextNode);

		if (parentNode != null) {
			return [parentNode];
		}

		return [];
	},

	preceding: <T extends XPathNode>(
		context: AxisEvaluationContext<T>,
		step: AnyStep
	): readonly T[] => {
		const { domProvider, rootNode, contextDocument, visited } = context;
		const contextNode = getDocumentOrderTraversalContextNode(domProvider, context.contextNode);

		if (visited.has(contextNode)) {
			return [];
		}

		visited.add(contextNode);

		if (contextNode === rootNode) {
			return [];
		}

		const parentNode = domProvider.getParentNode(contextNode);

		if (parentNode === contextDocument) {
			return documentRootPrecedingSiblings(domProvider, context, contextNode, step);
		}

		let lastChild: T | null;
		let previousSibling: T | null;

		if (step.nodeType === '__NAMED__') {
			previousSibling = domProvider.getPreviousSiblingElement(contextNode);
			lastChild = domProvider.getLastChildElement(contextNode);
		} else {
			previousSibling = domProvider.getPreviousSiblingNode(contextNode);
			lastChild = domProvider.getLastChildNode(contextNode);
		}

		if (lastChild === contextNode) {
			lastChild = null;
		}

		let currentNodes = [lastChild, previousSibling].filter((node) => node != null);

		if (contextNode !== rootNode && parentNode != null && parentNode !== rootNode) {
			const precedingParentSiblingsContext = axisEvaluationContext(context, parentNode);
			const precedingParentSiblings = axisEvaluators['preceding-sibling'](
				precedingParentSiblingsContext,
				step
			);

			currentNodes = currentNodes.concat(precedingParentSiblings);
		}

		return currentNodes.flatMap((currentNode) => {
			const currentContext = axisEvaluationContext(context, currentNode);

			return [currentNode].concat(axisEvaluators.preceding(currentContext, step));
		});
	},

	'preceding-sibling': <T extends XPathNode>(
		context: AxisEvaluationContext<T>,
		step: AnyStep
	): readonly T[] => {
		if (step.nodeType === '__NAMED__') {
			return siblings(context, 'getPreviousSiblingElement');
		}

		return siblings(context, 'getPreviousSiblingNode');
	},

	self: <T extends XPathNode>(context: AxisEvaluationContext<T>): readonly [T] => {
		return [context.contextNode];
	},
};

interface LocationPathEvaluationOptions {
	readonly contextPosition?: number;
	readonly contextSize?: number;
}

type ArbitraryNodesTemporaryCallee =
	| FilterPathExpressionEvaluator
	| LocationPathEvaluator
	| NodeSetFunction;

type AssertLocationPathEvaluationInstance = <T extends XPathNode>(
	context: EvaluationContext<T>,
	value: unknown,
	message?: string
) => asserts value is LocationPathEvaluation<T>;

// TODO: naming, general design/approach. This class has multiple, overlapping
// purposes:
//
// 1. Initial and intermediate context during a given evaluation of a given
//    location path. Intermediate in the sense that evaluating a location path
//    with multiple steps will produce instances for each step. Context in the
//    sense described by XPath, and the interface named `Context`.
//
// 2. An evaluation value, i.e. "node-set" in the XForms spec and a candidate
//    for concretion as an XPath result (also per spec) at a given expression's
//    terminus. In fact, an earlier iteration used the name `NodeSet` for this
//    reason. The current name took its place because of its responsibility for
//    providing context to location paths generally, and because it is
//    inherently also an evaluation which can be used to produce a result
//    (again, in the sense defined by the XPath spec).
//
// 3. As an internal implementation detail, an iterable instance over its
//    individual contextualized node values (contextualized in the sense that a
//    given node value has a position and a context size).
//
// It's tempting to break this up into any one or two of these responsibilities.
// This is exactly how it was implemented in earlier prototyping. But the
// implementation kept "wanting" to be a singular *thing*. In the course of
// evaluating location path steps, it most makes sense for this to be a context.
// In the course of evaluating sub-expressions (function arguments, predicates),
// it most makes sense for this to be an evaluation. Any breaking up from that
// perspective ultimately produces two "things" which convert between one
// another... because they really are different views on the same data.
//
// It's also tempting to keep the shared responsibilities in a single "thing",
// but to break those responsibilities up into sub-structures. That would be
// satisfying, but it would come with a bunch of coupling between those
// sub-structures to satisfy the various interfaces expecting some or all of
// this behavior/structure.
export class LocationPathEvaluation<T extends XPathNode>
	implements
		Evaluation<T, 'NODE'>,
		Context<T>,
		EvaluationContext<T>,
		Iterable<LocationPathEvaluation<T>>
{
	protected static isInstance<T extends XPathNode>(
		context: Context<T>,
		value: unknown
	): value is LocationPathEvaluation<T> {
		return value instanceof LocationPathEvaluation && value.domProvider === context.domProvider;
	}

	static readonly assertInstance: AssertLocationPathEvaluationInstance = (
		context,
		value,
		message
	) => {
		if (!this.isInstance(context, value)) {
			throw new Error(message ?? 'Expected a node-set result');
		}
	};

	// --- DOM adapter/provider ---
	readonly domProvider: XPathDOMProvider<T>;

	// --- Evaluation ---
	readonly type = 'NODE';

	protected readonly nodeEvaluations: ReadonlyArray<NodeEvaluation<T>>;

	// --- Context ---
	readonly evaluator: Evaluator<T>;
	readonly context: LocationPathEvaluation<T> = this;

	/**
	 * @see {@link Context.evaluationContextNode}
	 */
	readonly evaluationContextNode: T;

	readonly contextDocument: AdapterDocument<T>;
	readonly rootNode: AdapterParentNode<T>;

	readonly nodes: ReadonlySet<T>;

	protected computedContextSize: number;

	protected readonly initializedContextPosition: number;

	readonly functions: FunctionLibraryCollection;
	readonly namespaceResolver: NamespaceResolver<T>;

	readonly timeZone: Temporal.TimeZoneLike;

	/**
	 * TODO: this is a temporary accommodation for these cases which are presently
	 * not especially well designed:
	 *
	 * - Functions returning node-sets (i.e. {@link NodeSetFunction} instances).
	 *   It may make sense to invert control, invoking them from here?
	 *
	 * - Nodes filtered by predicate in {@link LocationPathExpression}. Such
	 *   filtering almost certainly should be performed here, in {@link step}.
	 */
	static fromArbitraryNodes<T extends XPathNode>(
		currentContext: LocationPathParentContext<T>,
		nodes: readonly T[],
		_temporaryCallee: ArbitraryNodesTemporaryCallee
	): LocationPathEvaluation<T> {
		return new this(currentContext, new Set(nodes));
	}

	static fromCurrentContext<T extends XPathNode>(
		evaluationContext: EvaluationContext<T>
	): LocationPathEvaluation<T> {
		if (LocationPathEvaluation.isInstance(evaluationContext, evaluationContext)) {
			return evaluationContext;
		}

		return new this(evaluationContext, evaluationContext.contextNodes);
	}

	static fromRoot<T extends XPathNode>(
		parentContext: LocationPathParentContext<T>
	): LocationPathEvaluation<T> {
		return new this(parentContext, new Set([parentContext.rootNode]));
	}

	protected constructor(
		readonly parentContext: LocationPathParentContext<T>,
		readonly contextNodes: ReadonlySet<T>,
		options: LocationPathEvaluationOptions = {}
	) {
		this.domProvider = parentContext.domProvider;

		const {
			evaluator,
			contextDocument,
			evaluationContextNode,
			functions,
			namespaceResolver,
			rootNode,
			timeZone,
		} = parentContext;

		this.evaluator = evaluator;
		this.contextDocument = contextDocument;
		this.evaluationContextNode = evaluationContextNode;
		this.functions = functions;
		this.namespaceResolver = namespaceResolver;
		this.rootNode = rootNode;
		this.timeZone = timeZone;

		this.nodes = contextNodes;

		this.nodeEvaluations = Array.from(contextNodes).map((node) => {
			return new NodeEvaluation(this, node);
		});
		this.computedContextSize = options.contextSize ?? contextNodes.size;
		this.initializedContextPosition = options.contextPosition ?? 1;
	}

	[Symbol.iterator]() {
		const nodes = this.contextNodes[Symbol.iterator]();
		const contextSize = this.contextSize();

		let contextPosition = this.contextPosition();

		return {
			next: (): IteratorResult<LocationPathEvaluation<T>> => {
				const next = nodes.next();

				if (next.done) {
					return next;
				}

				const value = new LocationPathEvaluation(this, new Set([next.value]), {
					contextPosition,
					contextSize,
				});

				contextPosition += 1;

				return {
					done: false,
					value,
				};
			},
		};
	}

	values(): ReadonlyArray<NodeEvaluation<T>> {
		return this.nodeEvaluations;
	}

	contextPosition(): number {
		return this.initializedContextPosition;
	}

	contextSize(): number {
		return this.computedContextSize;
	}

	currentContext<U extends XPathNode>(this: LocationPathEvaluation<U>): LocationPathEvaluation<U> {
		return LocationPathEvaluation.fromCurrentContext<U>(this);
	}

	rootContext<U extends XPathNode>(this: LocationPathEvaluation<U>): LocationPathEvaluation<U> {
		return LocationPathEvaluation.fromRoot<U>(this);
	}

	protected _first?: NodeEvaluation<T> | null;

	first(): NodeEvaluation<T> | null {
		let result = this._first;

		if (typeof result !== 'undefined') {
			return result;
		}

		[result = null] = this.nodeEvaluations;
		this._first = result;

		return result;
	}

	protected _isEmpty: boolean | null = null;

	protected isEmpty(): boolean {
		let result = this._isEmpty;

		if (result != null) {
			return result;
		}

		result = this.first() == null;
		this._isEmpty = result;

		return result;
	}

	some(predicate: (evaluation: NodeEvaluation<T>) => boolean): boolean {
		for (const evaluation of this.nodeEvaluations) {
			if (predicate(evaluation)) {
				return true;
			}
		}

		return false;
	}

	toBoolean(): boolean {
		return !this.isEmpty();
	}

	toNumber(): number {
		return this.first()?.toNumber() ?? NaN;
	}

	toString(): string {
		return this.first()?.toString() ?? '';
	}

	protected compare(comparator: EvaluationComparator<T>, operand: Evaluation<T>) {
		if (operand instanceof LocationPathEvaluation) {
			return this.some((lhs) => operand.some((rhs) => comparator(lhs, rhs)));
		}

		return this.some((lhs) => comparator(lhs, operand));
	}

	eq(operand: Evaluation<T>): boolean {
		if (operand.type === 'BOOLEAN') {
			return this.toBoolean() === operand.toBoolean();
		}

		return this.compare((lhs, rhs) => lhs.eq(rhs), operand);
	}

	ne(operand: Evaluation<T>): boolean {
		if (operand.type === 'BOOLEAN') {
			return this.toBoolean() !== operand.toBoolean();
		}

		return this.compare((lhs, rhs) => lhs.ne(rhs), operand);
	}

	lt(operand: Evaluation<T>): boolean {
		return this.compare((lhs, rhs) => lhs.lt(rhs), operand);
	}

	lte(operand: Evaluation<T>): boolean {
		return this.compare((lhs, rhs) => lhs.lte(rhs), operand);
	}

	gt(operand: Evaluation<T>): boolean {
		return this.compare((lhs, rhs) => lhs.gt(rhs), operand);
	}

	gte(operand: Evaluation<T>): boolean {
		return this.compare((lhs, rhs) => lhs.gte(rhs), operand);
	}

	step(step: AnyStep): LocationPathEvaluation<T> {
		const { domProvider, namespaceResolver } = this;

		let nodePredicate: (node: T) => boolean;

		switch (step.stepType) {
			case 'NodeTypeTest':
			case 'UnqualifiedWildcardTest':
				nodePredicate = getNodeTypePredicate(domProvider, step);
				break;

			case 'NodeNameTest': {
				const { nodeName } = step;
				const nullNamespaceURI = namespaceResolver.lookupNamespaceURI(null);

				nodePredicate = (node: T) => {
					if (!domProvider.isQualifiedNamedNode(node)) {
						return false;
					}

					const namespaceURI = domProvider.getNamespaceURI(node);

					return (
						domProvider.getLocalName(node) === nodeName &&
						(namespaceURI == null || namespaceURI === nullNamespaceURI)
					);
				};

				break;
			}

			case 'ProcessingInstructionNameTest': {
				const { processingInstructionName } = step;

				nodePredicate = (node: T) => {
					return (
						domProvider.isProcessingInstruction(node) &&
						domProvider.getProcessingInstructionName(node) === processingInstructionName
					);
				};

				break;
			}

			case 'QualifiedNameTest': {
				const { prefix, localName } = step;
				const namespaceURI = namespaceResolver.lookupNamespaceURI(prefix);

				nodePredicate = (node: T) => {
					return (
						domProvider.isQualifiedNamedNode(node) &&
						domProvider.getLocalName(node) === localName &&
						domProvider.getNamespaceURI(node) === namespaceURI
					);
				};

				break;
			}

			case 'QualifiedWildcardTest': {
				const { prefix } = step;
				const namespaceURI = namespaceResolver.lookupNamespaceURI(prefix);

				nodePredicate = (node: T) => {
					return (
						domProvider.isQualifiedNamedNode(node) &&
						domProvider.getNamespaceURI(node) === namespaceURI
					);
				};

				break;
			}

			default:
				throw new UnreachableError(step);
		}

		const { axisType } = step;
		const axisEvaluator = axisEvaluators[axisType];
		const context: AxisEvaluationCurrentContext<T> = {
			domProvider: this.domProvider,
			rootNode: this.rootNode,
			contextDocument: this.contextDocument,
			visited: new WeakSet(),
		};

		const nodes = Array.from(this.contextNodes).flatMap((contextNode) => {
			const currentContext = axisEvaluationContext(context, contextNode);
			const axisNodes = axisEvaluator(currentContext, step);

			return Array.from(axisNodes).filter(nodePredicate);
		});

		// TODO: this is out of spec! Tests currently depend on it. We could update
		// the tests, but making the minimal change necessary for refactor to
		// eliminate use of TreeWalker
		if (axisType === 'preceding' || axisType === 'preceding-sibling') {
			const sorted = nodes.slice().sort(context.domProvider.compareDocumentOrder);

			return new LocationPathEvaluation(this, new Set(sorted));
		}

		return new LocationPathEvaluation(this, new Set(nodes));
	}

	evaluateLocationPathExpression(
		expression: LocationPathExpressionEvaluator
	): LocationPathEvaluation<T> {
		const nodes = expression.evaluateNodes(this);

		return new LocationPathEvaluation(this, nodes);
	}
}
