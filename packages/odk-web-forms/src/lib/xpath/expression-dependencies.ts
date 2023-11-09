import type {
	AbsoluteLocationPathNode,
	FilterExprNode,
	FilterPathExprNode,
	RelativeLocationPathNode,
	StepNode,
	SyntaxNode,
	XPathNode,
} from '@odk/xpath/static/grammar/SyntaxNode.js';
import type { AnySyntaxType } from '@odk/xpath/static/grammar/type-names.js';
import type { CollectionValues } from '../collections/types';
import { xpathParser } from './parser.ts';

// TODO: this should probably be derived from the function definitions themselves.
// They don't actually support that (yet), and some are not yet implemented.
const nodesetReturningFunctionNames = ['id', 'instance', 'current', 'randomize'] as const;

type NodesetReturningFunctionName = CollectionValues<typeof nodesetReturningFunctionNames>;

const isNodesetReturningFunctionName = (
	functionName: string
): functionName is NodesetReturningFunctionName =>
	nodesetReturningFunctionNames.includes(functionName as NodesetReturningFunctionName);

type AnySyntaxNode = SyntaxNode<AnySyntaxType, readonly AnySyntaxNode[]> | XPathNode;

type LocationPathExprNode = AbsoluteLocationPathNode | FilterExprNode | RelativeLocationPathNode;

const isAnyLocationPathExprNode = (node: AnySyntaxNode): node is LocationPathExprNode => {
	const { type } = node;

	if (type === 'absolute_location_path' || type === 'relative_location_path') {
		return true;
	}

	if (type === 'filter_path_expr') {
		// TODO: all of these types probably need simplification, if they're so
		// jumbled in my own brain just a couple weeks after I committed them.
		const filterPathExprNode = node as unknown as FilterPathExprNode;
		const [filterExprChild] = filterPathExprNode.children[0].children;

		if (filterExprChild.type === 'function_call') {
			const [functionNameNode] = filterExprChild.children;
			const functionName = functionNameNode.text;

			if (isNodesetReturningFunctionName(functionName)) {
				return true;
			}
		}
	}

	return false;
};

const findLocationPathExprNodes = (node: AnySyntaxNode): readonly LocationPathExprNode[] => {
	if (isAnyLocationPathExprNode(node)) {
		return [node, ...node.children.flatMap((child) => findLocationPathExprNodes(child))];
	}

	return node.children.flatMap((childNode) => {
		return findLocationPathExprNodes(childNode);
	});
};

const locationPathDependencyStep = (syntaxNode: StepNode, index: number): string => {
	let result = '';

	for (const child of syntaxNode.children) {
		switch (child.type) {
			case 'abbreviated_step':
			case 'abbreviated_axis_test':
			case 'axis_test':
			case 'node_test':
				// TODO: this is a terrible hack. As is the treatment below of
				// `absolute_root_location_path` as a noop. All of this should be
				// addressed in the tree-sitter-xpath grammar, by capturing slashes in
				// step nodes. That'll have a whole other cascade of issues however.
				//
				// It's amazing this even kind of works as well as it does, but it's
				// servicable for demo purposes and feels (barely) acceptable to leave
				// in for now with a clear path forward for addressing it later.
				const stepSeparator = index === 0 ? '' : '/';

				result = `${result}${stepSeparator}${child.text}`;
				break;

			// Strip predicates
			case 'predicate':
				break;
		}
	}

	return result;
};

const locationPathDependency = (syntaxNode: LocationPathExprNode): string => {
	let result = '';

	for (const [index, child] of syntaxNode.children.entries()) {
		switch (child.type) {
			case 'absolute_root_location_path':
				break;

			case 'number':
			case '//':
			case 'string_literal':
			// Probably fine, as its parameters will be reached during recursion and
			// treated as separate dependencies
			case 'function_call':
				result = `${result}${child.text}`;
				break;

			case 'abbreviated_absolute_location_path':
				for (const sub of child.children) {
					switch (sub.type) {
						case '//':
							result = `${result}${child.text}`;
							break;

						case 'step':
							result = `${result}${locationPathDependencyStep(sub, index)}`;
							break;
					}
				}

				break;

			case 'step':
				result = `${result}${locationPathDependencyStep(child, index)}`;
				break;

			// TODO: `filter_expr`. The types for this case are wrong in
			// @odk/xpath/static/grammar/SyntaxNode.ts (they produce `expr`).
			default:
				const filterExpr = child as AnySyntaxNode as FilterExprNode;

				result = `${result}${filterExpr.text}`;
				break;
		}
	}

	return result;
};

// TODO: more copypasta ugh
/**
 * May be used to signal that a (generally tagged) union type is exhausted,
 * e.g. by `switch` or some other means of narrowing and handling each of its
 * union members.
 */
export class UnreachableError extends Error {
	constructor(unrechable: never, additionalDetail?: string) {
		let message = `Unreachable value: ${JSON.stringify(unrechable)}`;

		if (additionalDetail != null) {
			message = `${message} (${additionalDetail})`;
		}

		super(message);
	}
}

// TODO: this is a very small subset of resolution that needs to be supported,
// and it's a hamfisted hack. **This is temporary** to unblock progress on
// computations, but a longer term solution will need to address:
//
// - non-abbreviation axes (parent, child, self) according to XForms spec
// - non-leading axes
// - context expressions which are more complex than a series of explicit
//   element name test steps (this may be fine for binds!)
const resolveRelativeSubExpression = (contextExpression: string, expression: string) => {
	const [, axisAbbreviation, relativeExpression = ''] = expression.match(/^(\.{1,2})(\/.*$)?/) ?? [
		,
		'',
		expression,
	];

	switch (axisAbbreviation) {
		case '':
			return expression;

		case '.':
			return `${contextExpression}${relativeExpression}`;

		case '..':
			return `${contextExpression.replace(/\/[^/]+$/, '')}${relativeExpression}`;
	}

	throw new Error(`Unexpected relative expression: ${expression}`);
};

interface GetNodesetDependenciesOptions {
	readonly contextExpression?: string;
}

export const getNodesetDependencies = (
	expression: string,
	options: GetNodesetDependenciesOptions = {}
): readonly string[] => {
	const { rootNode } = xpathParser.parse(expression);
	const subExpressionNodes = findLocationPathExprNodes(rootNode);
	const { contextExpression } = options;
	const subExpressions = subExpressionNodes.map(locationPathDependency);

	if (contextExpression == null) {
		return subExpressions;
	}

	return subExpressions.map((subExpression) =>
		resolveRelativeSubExpression(contextExpression, subExpression)
	);
};
