import type { Signal } from 'solid-js';
import { createComputed, createMemo, createSignal, untrack } from 'solid-js';
import type { AttributeContext } from '../../instance/internal-api/AttributeContext.ts';
import type { InstanceValueContext } from '../../instance/internal-api/InstanceValueContext.ts';
import { ActionComputationExpression } from '../../parse/expression/ActionComputationExpression.ts';
import type { BindComputationExpression } from '../../parse/expression/BindComputationExpression.ts';
import { ActionDefinition, SET_ACTION_EVENTS } from '../../parse/model/ActionDefinition.ts';
import { createComputedExpression } from './createComputedExpression.ts';
import type { SimpleAtomicState, SimpleAtomicStateSetter } from './types.ts';

type ValueContext = AttributeContext | InstanceValueContext;

const isInstanceFirstLoad = (context: ValueContext) => {
	return context.rootDocument.initializationMode === 'create';
};

const isAddingRepeatChild = (context: ValueContext) => {
	return context.rootDocument.isAttached();
};

/**
 * Special case, does not correspond to any event.
 *
 * @see {@link shouldPreloadUID}
 */
const isEditInitialLoad = (context: ValueContext) => {
	return context.rootDocument.initializationMode === 'edit';
};

const getInitialValue = (context: ValueContext): string => {
	const sourceNode = context.instanceNode ?? context.definition.template;

	return context.decodeInstanceValue(sourceNode.value);
};

type BaseValueState = Signal<string>;

type RelevantValueState = SimpleAtomicState<string>;

/**
 * Wraps {@link baseValueState} in a signal-like interface which:
 *
 * - produces a blank value for nodes ({@link context}) in a non-relevant state
 * - persists, and restores, the most recent non-blank value state when a
 *   node/context's relevance is restored
 */
const createRelevantValueState = (
	context: ValueContext,
	baseValueState: BaseValueState
): RelevantValueState => {
	return context.scope.runTask(() => {
		const [getRelevantValue, setValue] = baseValueState;

		const getValue = createMemo(() => {
			if (context.isRelevant()) {
				return getRelevantValue();
			}

			return '';
		});

		return [getValue, setValue];
	});
};

/**
 * For fields with a `readonly` bind expression, prevent downstream
 * (client/user) writes when the field is in a `readonly` state.
 */
const guardDownstreamReadonlyWrites = (
	context: ValueContext,
	baseState: SimpleAtomicState<string>
): SimpleAtomicState<string> => {
	const { readonly } = context.definition.bind;

	if (readonly.isDefaultExpression) {
		return baseState;
	}

	const [getValue, baseSetValue] = baseState;

	const setValue: SimpleAtomicStateSetter<string> = (value) => {
		if (context.isReadonly()) {
			const reference = untrack(() => context.contextReference());

			throw new Error(`Cannot write to readonly field: ${reference}`);
		}

		return baseSetValue(value);
	};

	return [getValue, setValue];
};

/**
 * Per {@link https://getodk.github.io/xforms-spec/#preload-attributes:~:text=concatenation%20of%20%E2%80%98uuid%3A%E2%80%99%20and%20uuid()}
 */
const PRELOAD_UID_EXPRESSION = 'concat("uuid:", uuid())';

/**
 * @todo It feels increasingly awkward to keep piling up preload stuff here, but it won't stay that way for long. In the meantime, this seems like the best way to express the cases where `preload="uid"` should be effective, i.e.:
 *
 * - When an instance is first loaded ({@link isInstanceFirstLoad})
 * - When an instance is initially loaded for editing ({@link isEditInitialLoad})
 */
// TODO rename to isFirstLoad??
const shouldPreloadUID = (context: ValueContext) => {
	return isInstanceFirstLoad(context) || isEditInitialLoad(context);
};

/**
 * @todo This is a temporary one-off, until we support the full range of
 * {@link https://getodk.github.io/xforms-spec/#preload-attributes | preloads}.
 *
 * @todo ALSO, IMPORTANTLY(!): the **call site** for this function is
 * semantically where we would expect to trigger a
 * {@link https://getodk.github.io/xforms-spec/#event:odk-instance-first-load | odk-instance-first-load event},
 * _and compute_ preloads semantically associated with that event.
 */
// TODO expand on this
const setPreloadUIDValue = (context: ValueContext, valueState: RelevantValueState): void => {
	const { preload } = context.definition.bind;

	if (preload?.type !== 'uid' || !shouldPreloadUID(context)) {
		return;
	}

	const preloadUIDValue = context.evaluator.evaluateString(PRELOAD_UID_EXPRESSION, {
		contextNode: context.contextNode,
	});

	const [, setValue] = valueState;

	setValue(preloadUIDValue);
};

// TODO maybe merge these two if not too complicated/
const createBindCalculation = (
	context: ValueContext,
	setRelevantValue: SimpleAtomicStateSetter<string>,
	calculateDefinition: BindComputationExpression<'calculate'>
): void => {
	context.scope.runTask(() => {
		const calculate = createComputedExpression(context, calculateDefinition, {
			defaultValue: '',
		});

		createComputed(() => {
			if (context.isAttached() && context.isRelevant()) {
				const calculated = calculate();
				const value = context.decodeInstanceValue(calculated);

				setRelevantValue(value);
			}
		});
	});
};

/**
 * Defines a reactive effect which writes the result of `calculate` bind
 * computations to the provided value setter, on initialization and any
 * subsequent reactive update.
 *
 * @see {@link setPreloadUIDValue} for important details about spec ordering of
 * events and computations.
 */
const createCalculation = (
	context: ValueContext,
	setRelevantValue: SimpleAtomicStateSetter<string>,
	action: ActionDefinition
): void => {
	context.scope.runTask(() => {
		const calculate = createComputedExpression(context, action.computation);
		createComputed(() => {
			if (context.isAttached() && context.isRelevant()) {
				const calculated = calculate();
				const value = context.decodeInstanceValue(calculated);
				setRelevantValue(value);
			}
		});
	});
};

const referencesCurrentNode = (context: ValueContext, ref: string): boolean => {
	const newref = ref;
	const nodes = context.evaluator.evaluateNodes(newref, {
		contextNode: context.contextNode,
	});
	if (nodes.length > 1) {
		throw new Error('You are trying to target a repeated field. Currently you may only target a field in a specific repeat instance. XPath nodeset has more than one node.');
	}
	return nodes.includes(context.contextNode);
};

// TODO rename
const fixUnboundRepeatsInRef = (context: ValueContext, source: string, ref: string): { source: string, ref: string } => {
	const contextRef = context.contextReference();
	for (const part of contextRef.matchAll(/([^\[]*)(\[[0-9]+\])/gm)) {
		const unbound = part[1]! + '/';
		const bound = part[0]! + '/';
		if (source.includes(unbound)) {
			source = source.replace(unbound, bound);
			ref = ref.replace(unbound, bound);
		}
	}
	return {source, ref};
};

const registerActions = (
	context: ValueContext,
	action: ActionDefinition,
	relevantValueState: RelevantValueState
) => {
	const [, setValue] = relevantValueState;
	if (action.events.includes(SET_ACTION_EVENTS.odkInstanceFirstLoad)) {
		if (shouldPreloadUID(context)) {
			if (!isAddingRepeatChild(context)) {
				createCalculation(context, setValue, action); // TODO change to be more like setPreloadUIDValue
			}
		}
	}
	if (action.events.includes(SET_ACTION_EVENTS.odkInstanceLoad)) {
		if (!isAddingRepeatChild(context)) {
			createCalculation(context, setValue, action); // TODO change to be more like setPreloadUIDValue
		}
	}
	if (action.events.includes(SET_ACTION_EVENTS.odkNewRepeat)) {
		if (isAddingRepeatChild(context)) {
			createCalculation(context, setValue, action); // TODO change to be more like setPreloadUIDValue
		}
	}
	if (action.events.includes(SET_ACTION_EVENTS.xformsValueChanged)) {

		let initial = '';
		// TODO put the source in actiondefinition
		// TODO source is required
		const source = action.element.parentElement?.getAttribute('ref')!;
		const res = fixUnboundRepeatsInRef(context, source, action.ref);
		const newsource = res.source;
		const newref = res.ref;

		context.scope.runTask(() => {
			const sourceElementExpression = new ActionComputationExpression('string', newsource);
			const calculateValueSource = createComputedExpression(context, sourceElementExpression); // registers listener
			createComputed(() => {
				if (context.isAttached() && context.isRelevant()) {
					const valueSource = calculateValueSource();
					if (initial !== valueSource) {
						initial = valueSource;
						if (referencesCurrentNode(context, newref)) {
							const calc = context.evaluator.evaluateString(action.computation.expression, context);
							const value = context.decodeInstanceValue(calc);
							setValue(value);
						}
					}
				}
			});
		});
		
	}
};

export type InstanceValueState = SimpleAtomicState<string>;

/**
 * Provides a consistent interface for value nodes of any type which:
 *
 * - derives initial state from either an existing instance (e.g. for edits) or
 *   the node's definition (e.g. initializing a new instance)
 * - decodes current primary instance state into the value node's runtime type
 * - encodes updated runtime values to store updated instance state
 * - initializes reactive computation of `calculate` bind expressions for those
 *   nodes defined with one
 * - prevents downstream writes to nodes in a readonly state
 */
export const createInstanceValueState = (context: ValueContext): InstanceValueState => {
	return context.scope.runTask(() => {
		const initialValue = getInitialValue(context);
		const baseValueState = createSignal(initialValue);
		const relevantValueState = createRelevantValueState(context, baseValueState);

		/**
		 * @see {@link setPreloadUIDValue} for important details about spec ordering of events and computations.
		 */
		setPreloadUIDValue(context, relevantValueState); // TODO what does preload do in repeat instances?

		const { calculate } = context.definition.bind;

		if (calculate != null) {
			const [, setValue] = relevantValueState;
			createBindCalculation(context, setValue, calculate);
		}

		const action = context.definition.action;

		if (action) {
			registerActions(context, action, relevantValueState);
		}

		return guardDownstreamReadonlyWrites(context, relevantValueState);
	});
};
