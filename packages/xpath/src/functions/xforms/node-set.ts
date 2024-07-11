import { UpsertableWeakMap } from '@getodk/common/lib/collections/UpsertableWeakMap.ts';
import { ScopedElementLookup } from '@getodk/common/lib/dom/compatibility.ts';
import type { LocalNamedElement } from '@getodk/common/types/dom.ts';
import { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';
import { FunctionImplementation } from '../../evaluator/functions/FunctionImplementation.ts';
import { NodeSetFunction } from '../../evaluator/functions/NodeSetFunction.ts';
import { NumberFunction } from '../../evaluator/functions/NumberFunction.ts';
import { StringFunction } from '../../evaluator/functions/StringFunction.ts';
import { XFormsXPathEvaluator } from '../../index.ts';
import { seededRandomize } from '../../lib/collections/sort.ts';
import type { MaybeElementNode } from '../../lib/dom/types.ts';
import type { ModelElement } from '../../xforms/XFormsXPathEvaluator.ts';

export const countNonEmpty = new NumberFunction(
	'count-non-empty',
	[{ arityType: 'required' }],
	(context, [expression]): number => {
		const results = expression!.evaluate(context);

		if (results.type !== 'NODE') {
			throw 'todo';
		}

		let result = 0;

		for (const self of results) {
			if (self.toString() !== '') {
				result += 1;
			}
		}

		return result;
	}
);

/**
 * Filters a node-set {@link evaluation} to derive a node-set (and evaluation
 * context) which only includes nodes descending from one or more nodes in the
 * {@link ancestorContext} node-set/context.
 *
 * @todo This is general enough we could theoretically use it elsewhere. But
 * it's unclear if we **should**. There is a clear expectation of this behavior
 * from ported JavaRosa tests of `indexed-repeat`, which is specialized
 * shorthand with clear intent. Broader application could break with some of our
 * assumptions about absolute/relative expressions otherwise.
 */
const filterContextDescendants = (
	ancestorContext: LocationPathEvaluation,
	evaluation: LocationPathEvaluation
): LocationPathEvaluation => {
	const resultNodes = Array.from(evaluation.nodes).filter((node) => {
		return ancestorContext.some((context) => {
			return context.value.contains(node);
		});
	});

	return LocationPathEvaluation.fromArbitraryNodes(ancestorContext, resultNodes, indexedRepeat);
};

/**
 * Per {@link https://getodk.github.io/xforms-spec/#fn:indexed-repeat}:
 *
 * > `indexed-repeat(//node, /path/to/repeat, //index1,
 * > /path/to/repeat/nested-repeat, //index2)` is meant to be a shortcut for
 * > `//repeat[position()=//index1]/nested-repeat[position()=index2]/node`
 *
 * **FOR DISCUSSION**
 *
 * This implementation currently makes the following judgement calls:
 *
 * 1. None of the logic is repeat specific, and the function will behave the
 *    same way when specifying node-sets that do not correspond to repeats (or
 *    even to an XForm document structure). While the naming and spec language
 *    are clearly repeat-specific, the spec's explanation shows how the function
 *    maps to a more general LocationPath expression. The intent (at least for
 *    now) is to support that generalization, and only add repeat-specific
 *    restrictions if there's a compelling reason. (Besides being simpler this
 *    way, it will almost certainly perform better as well.)
 *
 * 2. Node-set results produced by the first `target` argument are
 *    contextualized to their containing "repeats" node-set (i.e. whichever node
 *    is resolved by the last `repeatN`/`indexN` pair). This is directly tested
 *    by `scenario` tests ported from JavaRosa. Notably, **this deviates** from
 *    any other handling of absolute paths by this package. A case can be made
 *    that it's consistent with the underlying XPath specification, if a bit
 *    surprising.
 *
 * 3. The node-set produced by `repeat1` is **not contextualized** to its
 *    containing node-set (i.e. the evaluation context), and this is also tested
 *    directly by `scenario` tests ported from JavaRosa. This should be
 *    consistent with expectations; it's noted here mostly because it differs
 *    from the next point...
 *
 * 4. The respective node-sets produced by `repeat2`, `repeat3` (and beyond\*)
 *    **are contextualized**, respectively, to the previous node-set context
 *    (i.e. `repeat2` is filtered to include only descendants of
 *    `repeat1[index1]`, `repeat3` is in turn filtered to include only
 *    descendants of `repeat2[index2]`). This behavior is not tested directly by
 *    JavaRosa, but the intent is inferred by behavior of the first `target`
 *    argument, and assumed from the spec example.
 *
 * 5. **!!!** None of the `indexN` arguments are contextualized in any special
 *    way, they're evaluated just as if they were written as a position
 *    predicate. At present, it's not clear whether there's a reliable way to
 *    infer intent otherwise:
 *
 *   - The spec's example uses only relative references (and uses them in a
 *     fairly confusing and inconsistent way)
 *
 *   - The ported JavaRosa tests do use an absolute `index1` expression, but it
 *     references a single static node, outside of the repeat hierarchy.
 *
 *   - It seems likely (although I haven't tested the hunch) that JavaRosa
 *     **would contextualize** the `indexN` arguments. But this wouldn't be a
 *     strong signal of intent, because JavaRosa contextualizes absolute
 *     expressions in a much broader set of scenarios that we now know are out
 *     of scope.
 *
 * 6. The `indexed-repeat` function as specified should return a string. We
 *    currently return a node-set, because the function's logic is clearly
 *    designed to deal with node-sets. We do, however, filter the final (first
 *    `target` argument) result to the first node in that node-set (if any). In
 *    any case, wherever usage expects a string, it will go through the normal
 *    type casting logic consistent with spec, so returning a single node
 *    node-set seems safe. In theory, by returning a node-set, we could also use
 *    this implementation in a `FilterExpr` (e.g.
 *    `indexed-repeat(...)/even-deeper/steps[also="predicates"]).
 *
 * \* Bonus judgement call: the function is specified to a maximum depth of 3,
 *    but this implementation is variadic to any depth. We discussed this
 *    briefly, and it seemed like the consensus at the time was that it should
 *    be fine.
 *
 * - - -
 *
 * @todo Other parts of the ODK XForms spec suggest that `//` syntax is not
 * actually expected to be supported. Specifically
 * {@link https://getodk.github.io/xforms-spec/#xpath-axes | XPath Axes } says
 * that "only the _parent_, _child_ and _self_ axes are supported" (whereas `//`
 * is shorthand for `/descendant-or-self::node()/`). However, that is presumably
 * a JavaRosa limitation. This package supports all of the XPath 1.0 axes, as
 * well as that shorthand syntax. At time of writing, as far as I can see, the
 * quote above describing `indexed-repeat` is the only remaining part of the
 * spec referencing that axis. There are `scenario` tests ported from JavaRosa
 * exercising some of this function's behavior already, but they do not exercise
 * the syntax as referenced in the description. We should add unit tests in this
 * package to test that case, but this was deferred for now as usage in the spec
 * example is confusing.
 */
export const indexedRepeat = new FunctionImplementation(
	'indexed-repeat',
	[
		{ arityType: 'required', typeHint: 'node' }, // arg
		{ arityType: 'required', typeHint: 'node' }, // repeat1
		{ arityType: 'required', typeHint: 'number' }, // index1
		{ arityType: 'optional', typeHint: 'node' }, // repeatN=0 -> repeat2
		{ arityType: 'optional', typeHint: 'number' }, // indexN=0 -> index2
		{ arityType: 'optional', typeHint: 'node' }, // repeatN=1 -> repeat3
		{ arityType: 'optional', typeHint: 'number' }, // indexN=1 -> index3

		// Go beyond spec? Why the heck not! It's clearly a variadic design.
		{ arityType: 'variadic', typeHint: 'any' },
	],
	(context, [target /* arg */, ...rest /* repeat1, index1[, repeatN, indexN]* */]) => {
		let currentContext = context;

		for (let i = 0; i < rest.length; i += 2) {
			const repeatN = rest[i];
			const indexN = rest[i + 1];

			if (repeatN == null) {
				break;
			}

			if (indexN == null) {
				throw 'todo: repeat/index pairs are spec for signature';
			}

			const evaluation = repeatN.evaluate(currentContext);

			if (!(evaluation instanceof LocationPathEvaluation)) {
				throw 'todo: not a node-set';
			}

			let repeats = evaluation;

			// repeat1 is inherently filtered by the initial context, while repeatN >
			// where N > 1 must (implicitly) be filtered to include only descendants
			// of the first iteration:
			//
			// - if the repeat1 expression is relative, evaluating it with the
			//   expression context will be filtered automatically
			//
			// - if it is absolute, it is expected to resolve absolute (to the
			//   context root); this way computations can call `indexed-repeat` from
			//   other arbitrary context nodes (as is the case in ported JR tests)
			//
			// - if repeat2 (and so on) is absolute, it **must** be implicitly scoped
			//   to the context established by the previous iteration (otherwise the
			//   function signature makes no sense! Only the last indexN would apply)
			if (i > 0) {
				repeats = filterContextDescendants(currentContext, repeats);
			}

			currentContext = repeats.evaluatePositionPredicate(indexN);
		}

		// Non-null assertion here should be safe because the required parameter
		// is checked by `FunctionImplementation`.
		const targetsResult = target!.evaluate(currentContext);

		if (!(targetsResult instanceof LocationPathEvaluation)) {
			// Not fond of adding more throw string statements, but this will make it
			// easier to find along with all of the other cases of this exact same
			// assertion. We have a broader story around error propagation which will
			// implicate all of these. We should also consider internal APIs which
			// will do checks like this where appropriate without them being scattered
			// ad-hoc throughout the function implementations concerned with them.
			throw 'todo: not a node-set';
		}

		const results = filterContextDescendants(currentContext, targetsResult);

		// Awkward bit of internal API. This returns either:
		//
		// - The first node in the resulting node-set, or
		// - An empty node-set in the result's context
		//
		// It would be nice to reuse `evaluatePositionPredicate` here, but we'd
		// need to fake up a compatible "evaluator" interface and then fake an
		// `EvaluationResult` for it to produce. This is considerably simpler.
		return results.first() ?? results;
	}
);

interface InstanceElement extends LocalNamedElement<'instance'> {}

const identifiedInstanceLookup = new ScopedElementLookup(':scope > instance[id]', 'instance[id]');

type InstanceID = string;

const instancesCache = new UpsertableWeakMap<
	ModelElement,
	ReadonlyMap<InstanceID | null, InstanceElement>
>();

const getInstanceElementByID = (modelElement: ModelElement, id: string): Element | null => {
	const instances = instancesCache.upsert(modelElement, () => {
		const instanceElements = Array.from(
			identifiedInstanceLookup.getElements<InstanceElement>(modelElement)
		);

		return new Map(
			instanceElements.map((element) => {
				return [element.getAttribute('id'), element];
			})
		);
	});

	return instances.get(id) ?? null;
};

export const instance = new NodeSetFunction(
	'instance',
	[{ arityType: 'required' }],
	(context, [idExpression]): readonly Element[] => {
		const id = idExpression!.evaluate(context).toString();
		const { evaluator } = context;

		if (!(evaluator instanceof XFormsXPathEvaluator)) {
			throw new Error('itext not available');
		}

		const { modelElement } = evaluator;

		if (modelElement == null) {
			return [];
		}

		const instanceElement = getInstanceElementByID(modelElement, id);

		return instanceElement == null ? [] : [instanceElement];
	}
);

// TODO: Only kinda sorta a node-set fn. Not a boolean fn either though! Returns
// a string... where // does this belong?
export const once = new StringFunction(
	'once',
	[{ arityType: 'required' }],
	(context, [expression]): string => {
		const [contextNode] = context.contextNodes;

		if (contextNode == null) {
			throw 'todo once no context';
		}

		const string = contextNode.textContent ?? '';

		if (string === '') {
			// TODO: probably memoize, it's at least sort of implied by the name
			return expression!.evaluate(context).toString();
		}

		return string;
	}
);

// TODO: this probably belongs in `fn`?
export const position = new NumberFunction(
	'position',
	[{ arityType: 'optional' }],
	(context, [expression]): number => {
		if (expression == null) {
			return context.contextPosition();
		}

		const results = expression.evaluate(context);

		if (!(results instanceof LocationPathEvaluation)) {
			throw 'todo not a node-set';
		}

		const [first, next] = results.values();

		if (first == null) {
			// TODO: is this right? Doesn't seem like any tests exercise it.
			return NaN;
		}

		if (next != null) {
			throw 'todo enforce single node(?)';
		}

		const { value } = first;
		const { nodeName } = value as MaybeElementNode;

		let currentNode: MaybeElementNode | null = value as MaybeElementNode;
		let result = 1;

		while ((currentNode = currentNode!.previousSibling as MaybeElementNode | null) != null) {
			if (currentNode.nodeName === nodeName) {
				result += 1;
			}
		}

		return result;
	}
);

export const randomize = new NodeSetFunction(
	'randomize',
	[
		{ arityType: 'required', typeHint: 'node' },
		{ arityType: 'optional', typeHint: 'number' },
	],
	(context, [expression, seedExpression]) => {
		const results = expression!.evaluate(context);

		if (!(results instanceof LocationPathEvaluation)) {
			throw 'todo (not a node-set)';
		}

		const nodeResults = Array.from(results.values());
		const nodes = nodeResults.map(({ value }) => value);
		const seed = seedExpression?.evaluate(context).toNumber();

		return seededRandomize(nodes, seed);
	}
);
