import {
	getPropertyDescriptors,
	getPropertyKeys,
} from '@odk-web-forms/common/lib/objects/structure.ts';
import type { Primitive } from '@odk-web-forms/common/types/Primitive.ts';
import type { ShallowMutable } from '@odk-web-forms/common/types/helpers.js';
import { createComputed, untrack } from 'solid-js';
import { createMutable } from 'solid-js/store';
import type { ActiveLanguage } from '../../client/FormLanguage.ts';
import type { OpaqueReactiveObjectFactory } from '../../client/OpaqueReactiveObjectFactory.ts';
import type { SelectItem } from '../../client/SelectNode.ts';
import type { AnyNode } from '../../client/hierarchy.ts';
import { createReactiveScope, type ReactiveScope } from './scope.ts';

/**
 * For a first pass, certain value types are intentionally left for subsequent commits. As such, to begin we only support primitives as reactive property values. Cases not yet handled include:
 *
 * - Reactive `children` (repeat instances), which are expected to be represented as a mapping to/from their `nodeId`s
 * - The non-primitive representation of a form's language
 * - A select node's available options and selected value(s)
 */
type IncompleteValueSupport = unknown;

// prettier-ignore
type SupportedReactiveStateValue =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| Primitive
	| ActiveLanguage
	| readonly SelectItem[];

interface IdentifiedNode {
	readonly nodeId: string;
}

/**
 * @see {@link InitialState} for details.
 *
 * @todo supporting reactive `children` to be addressed in a subsequent commit.
 */
// prettier-ignore
export type InitialStateValue<Value> =
	Value extends SupportedReactiveStateValue
		? Value
	: Value extends readonly IdentifiedNode[]
		? Value & { readonly todo?: never }
		: never;

/**
 * Restricts the type of initial state's property values. This is a bit of
 * indirection that allows us to ensure we're only building state with supported
 * object structures, while preserving type compatibility with the more
 * permissive {@link OpaqueReactiveObjectFactory}.
 */
type InitialState<T> = {
	[K in keyof T]: InitialStateValue<T[K]>;
};

/**
 * @see {@link SharedState} for details.
 *
 * @todo @see {@link IncompleteValueSupport}
 */
// prettier-ignore
type SharedStateValue<Value> =
	Value extends SupportedReactiveStateValue
		? Value
	: Value extends readonly IdentifiedNode[]
		? Value & { readonly todo?: never }
		: never;

/**
 * State shared between the engine and client is intentionally restricted, to
 * prevent nested reactivity calls. Where our interface design expects
 * structural nesting (repeat instances as `children` of their repeat range
 * container node) the values must be mapped to a non-nested representation.
 * Where a repeat range's initial state might be:
 *
 * ```ts
 * type NodeID = string;
 *
 * interface RepeatInstanceNode {
 *   readonly nodeId: NodeID;
 *   // ...
 * }
 *
 * interface RepeatRangeState {
 *   get children(): readonly RepeatInstanceNode[];
 *   // ...
 * }
 * ```
 *
 * ... the reactive representation will be:
 *
 * ```ts
 * interface ReactiveRepeatRangeState {
 *   get children(): readonly NodeID[];
 *   // ...
 * }
 * ```
 *
 * @todo A future commit will also relax restrictions for other structural types
 * where nesting is not a concern.
 *
 * @todo @see {@link IncompleteValueSupport}
 */
type SharedState<T> = {
	[K in keyof T]: SharedStateValue<T[K]>;
};

declare const CLIENT_STATE: unique symbol;
type ClientStateBrand = typeof CLIENT_STATE;

declare const ENGINE_STATE: unique symbol;
type EngineStateBrand = typeof ENGINE_STATE;

type StateBrand = ClientStateBrand | EngineStateBrand;

/**
 * Helps to prevent mistaken assignment of engine state to client state; the
 * inverse may also be possible otherwise, depending on mutability restrictions,
 * and this will help prevent that as well.
 *
 * The types of both state objects will otherwise be assignable in most cases,
 * but the result of passing one where the other is expected would assuredly
 * create bugs which may be subtle and difficult to diagnose/debug.
 */
// prettier-ignore
type BrandedSharedState<Brand extends StateBrand, T extends object> =
	& SharedState<T>
	& { readonly [K in Brand]?: never };

// prettier-ignore
export type EngineState<T extends object> = BrandedSharedState<
	EngineStateBrand,
	ShallowMutable<T>
>;

/**
 * Converts the initial state object into a representation suitable for our
 * reactive design, where:
 *
 * - Computed (`get` accessor) properties on the initial state object are passed
 *   through as reads to the initial state object. This is intended to support
 *   cases where certain aspects of the state are themselves internally
 *   reactive. @see {@link engineClientState} for additional details.
 *
 * - Where children are expected to be reactive (repeat instances), they're
 *   stored internally as a reactive array of those nodes' ids, to avoid nested
 *   reactive factory calls.
 *
 * @todo @see {@link IncompleteValueSupport}
 */
const engineStateRepresentation = <T extends object>(
	initialState: InitialState<T>
): SharedState<T> => {
	const sharedState = Object.create(null) as SharedState<T>;
	const descriptors = getPropertyDescriptors(initialState);

	descriptors.forEach(([key, descriptor]) => {
		if (descriptor.writable) {
			sharedState[key] = initialState[key];
		} else if (descriptor.get != null) {
			if (descriptor.set == null) {
				Object.defineProperty(sharedState, key, {
					configurable: true,
					enumerable: descriptor.enumerable ?? true,
					get: () => {
						return initialState[key];
					},
				});
			}
		} else {
			throw new Error(`Unsupported property descriptor for key: ${key}`);
		}
	});

	return sharedState;
};

/**
 * @todo @see {@link IncompleteValueSupport}
 */
export const createEngineState = <T extends object>(
	initialState: InitialState<T>
): EngineState<T> => {
	const sharedState = engineStateRepresentation(initialState);

	return createMutable(sharedState as EngineState<T>);
};

export type ClientState<T extends object> = BrandedSharedState<ClientStateBrand, T>;

// Imported here to hopefully avoid exposing this currently test-only module in
// the compiled types.
type AlternativeInternalReactiveImplementation =
	typeof import('../../../test/helpers/reactive/internal.ts');

/**
 * @todo @see {@link IncompleteValueSupport}
 */
const isEngineStateValueEqual = <T, U extends T>(previous: T, current: U): current is T & U => {
	return Object.is(previous, current);
};

/**
 * Synchronously, reactively reflects state changes from an engine state object
 * to its corresponding client state object.
 *
 * Note: this is intentionally unidirectional. @see {@link engineClientState}
 * for additional details.
 *
 * Notes/warnings on reactivity implementation details: {@link createComputed}
 * essentially initiates a very naive reactive effect, with no special behavior
 * for batching or initiation timing. There are a few caveats to using this
 * primitive—some noted in the documentation and some observed in commentary by
 * Solid's creator and/or discussions in the community:
 *
 * - It should generally not be used to write to signals/Solid stores within the
 *   same reactive scope. Its usage here is justified because this could only
 *   occur if a Solid client were implemented within the engine itself.
 *
 * - It may execute more frequently than desired (i.e. it has no special
 *   behavior for batching) This is mitigated with an equality check to avoid
 *   repeatedly/excessively propagating identical state values to a client.
 *
 * - It may someday be removed from Solid's public API; Solid's creator has
 *   repeatedly expressed wanting to make this change. It's unlikely we can
 *   mitigate this, but we can observe that it would likely have already been
 *   removed if it didn't serve necessary end-user use cases. And we can be
 *   somewhat prepared by having a potential
 *   {@link AlternativeInternalReactiveImplementation | alternative internal reactive implementation}
 *   which already provides a primitive with the same semantics.
 */
const reflectEngineClientState = <T extends object>(
	engineState: EngineState<T>,
	clientState: SharedState<T>
): ClientState<T> => {
	const stateKeys = getPropertyKeys(engineState);
	const [firstStateKey] = stateKeys;

	// If the state has no keys, state reflection is a noop. Otherwise, we'll
	// check its presence in the client state to validate (implicitly for all
	// keys) that the initial reflection has occurred synchronously before exiting
	// the function.
	//
	// TODO: this is probably more appropriate to treat as an error!
	if (firstStateKey == null) {
		return clientState;
	}

	stateKeys.forEach((key) => {
		let previousValue: EngineState<T>[typeof key];
		let currentValue: EngineState<T>[typeof key];

		createComputed(() => {
			previousValue = currentValue;
			currentValue = engineState[key];

			// Prevent propagating multiple assignment out to clients. The engine
			// will batch these automatically in most circumstances (as long as it
			// continues using Solid for internal reactivity), but we can't make the
			// same assumption for clients' opaque reactive constructors.
			//
			// TODO: equality nuances for non-`Primitive`s (i.e `children`)
			if (!isEngineStateValueEqual(previousValue, currentValue)) {
				Reflect.set(clientState, key, currentValue);
			}
		});
	});

	if (!(firstStateKey in clientState)) {
		throw new Error('Synchronous engine/client state reflection failed.');
	}

	return clientState;
};

const UNASSIGNED_PROPERTY_DESCRIPTOR: PropertyDescriptor = {
	enumerable: true,
	configurable: true,
	writable: true,
};

export const createClientState = <T extends object>(
	clientStateFactory: (initialState: SharedState<T>) => SharedState<T>,
	scope: ReactiveScope,
	engineState: EngineState<T>
): ClientState<T> => {
	const keys = getPropertyKeys(engineState);
	const descriptors = keys.map((key): readonly [string & keyof T, PropertyDescriptor] => {
		return [key, UNASSIGNED_PROPERTY_DESCRIPTOR];
	});

	// We initialize the client state with all of the state's **keys** but without
	// assigning any of its values. This is because a client's state factory might
	// expect a fixed object shape on creation (our internal test factory does!).
	const clientState = clientStateFactory(
		Object.create(null, Object.fromEntries(descriptors)) as SharedState<T>
	);

	return scope.runTask(() => {
		return reflectEngineClientState(engineState, clientState);
	});
};

// prettier-ignore
type EngineStateValueUpdateCallback<T extends object, K extends keyof T> = (
	currentValue: EngineState<T>[K]
) => EngineState<T>[K];

type EngineStateValue<T extends object, K extends keyof T> = EngineState<T>[K];

// prettier-ignore
type EngineStateValueUpdate<T extends object, K extends keyof T> =
	| EngineStateValue<T, K>
	| EngineStateValueUpdateCallback<T, K>;

const isUpdateCallback = <T extends object, K extends keyof T>(
	update: EngineStateValueUpdate<T, K>
): update is EngineStateValueUpdateCallback<T, K> => {
	return typeof update === 'function';
};

type UpdateEngineStateValue<T extends object> = <K extends keyof T>(
	key: K,
	update: EngineStateValueUpdate<T, K>
) => EngineState<T>[K];

const updateSharedStateValueFactory = <T extends object>(
	scope: ReactiveScope,
	engineState: EngineState<T>
): UpdateEngineStateValue<T> => {
	return <K extends keyof T>(key: K, update: EngineStateValueUpdate<T, K>) => {
		return scope.runTask(() => {
			let updatedValue: EngineState<T>[K];

			if (isUpdateCallback(update)) {
				// Note: providing a current value to an update callback doesn't
				// typically constitute a read; otherwise, writing to state in an
				// effect/effect-like subscription context could create an infinite
				// subscription/effect loop just by accessing that current state.
				const currentValue = untrack(() => {
					return engineState[key];
				});

				updatedValue = update(currentValue);
			} else {
				updatedValue = update;
			}

			engineState[key] = updatedValue;

			// Note: this also should not constitute a read which might trigger a
			// reactive subscription. We currently return the updated value, but if we
			// ever expand this implementation to support computed setters, it's
			// possible this value will be different from the value produced by
			// reading `engineState[key]` again after the write.
			return updatedValue;
		});
	};
};

/**
 * @see {@link engineClientState} for additional details.
 */
export interface EngineClientState<T extends object> {
	/**
	 * The internal reactive scope in which the {@link EngineClientState} was
	 * created. This may be used, for example, to dispose of that scope when a
	 * node is removed.
	 *
	 * @todo It's not yet clear whether the above should be more prescriptive,
	 * i.e. to say that it **should** or **must** be used to dispose of the scope
	 * on node removal.
	 */
	readonly scope: ReactiveScope;

	/**
	 * A reactive mutable store used for engine-internal state and as a source for
	 * reactive logic based on that state. This should be used and understood as
	 * the source of truth for any node's state.
	 *
	 * @see {@link engineClientState} for additional details.
	 *
	 * @todo this should be an Engine-branded `Mutable<T>`, and handle mapping
	 * children back from their node IDs
	 */
	readonly engineState: EngineState<T>;

	/**
	 * A representation of the same state stored in {@link engineState}, which is
	 * **potentially** reactive (as produced by the client-provided
	 * {@link OpaqueReactiveObjectFactory}). This should be provided to clients as
	 * a mechanism to **read** a node's state, and to subscribe to state updates
	 * within the client's reactive model (if any).
	 *
	 * @see {@link engineClientState} for additional details.
	 *
	 * @todo this should be a Client-branded `T`, and handle mapping children back
	 * from their node IDs
	 */
	readonly clientState: ClientState<T>;

	/**
	 * Provides a consistent interface to perform state updates. This method
	 * writes directly to the specified key in {@link engineState}; those state
	 * changes are in turn written, reactively, to {@link clientState}.
	 *
	 * @see {@link engineClientState} for additional details.
	 */
	readonly updateValue: UpdateEngineStateValue<T>;
}

/**
 * Provides support for implementing a
 * ({@link AnyNode.currentState | node's state}) as represented by a pair of
 * objects:
 *
 * - {@link engineState}: used internally as the engine's source of truth,
 *   implemented as a mutable reactive store
 * - {@link clientState}: **potentially** reactive, as produced by the
 *   client-provided {@link clientReactiveFactory}
 *   ({@link OpaqueReactiveObjectFactory})
 *
 * The engine is expected to issue writes to {@link engineState}. A helper
 * method, {@link updateValue}, is also provided to facilitate the most common
 * update use cases. This method should preferred over arbitrary property
 * assignment mutations, as it helps to preserve clarity about the intended
 * effect of writes.
 *
 * The client is not expected to perform any writes directly to this
 * representation of state. Instead each {@link AnyNode | node} provides an
 * interface appropriate to that node type to facilitate writes by the client.
 *
 * Reflection between states is handled automatically, propagating writes **from
 * {@link engineState} to {@link clientState}**. As such, it is important to
 * note that even though a node's write methods may be intended for client
 * usage, those writes **should ultimately be issued by the node against
 * {@link engineState}**. This is another benefit of using the provided
 * {@link updateValue} method rather than directly mutating the state by
 * property assignment.
 *
 * @todo if this turns out to be a footgun, resulting in bugs related to
 * external writes performed directly on {@link clientState}, we should consider
 * establishing runtime guards to ensure the store is externally immutable.
 *
 * There is also explicit accommodation for certain properties to be computed.
 * Any property on {@link initialState} defined as a `get` accessor will be
 * preserved as such on {@link engineState}, and reflected automatically to a
 * corresponding `get` accessor on {@link clientState}. This allows, for
 * instance, properties associated with bind computations (`readonly`,
 * `relevant`, `required`, `constraint`, etc.) to be implemented as part of the
 * definition of {@link initialState}.
 *
 * @todo @see {@link IncompleteValueSupport}
 */
export const engineClientState = <T extends object>(
	clientStateFactory: (initialState: SharedState<T>) => SharedState<T>,
	initialState: InitialState<T>
): EngineClientState<T> => {
	// TODO: there are several aspects of cleanup we might consider doing if the
	// scope's `dispose` method is called.
	const scope = createReactiveScope();

	return scope.runTask(() => {
		const engineState = createEngineState(initialState);
		const clientState = createClientState(clientStateFactory, scope, engineState);
		const updateValue = updateSharedStateValueFactory(scope, engineState);

		return {
			scope,
			engineState,
			clientState,
			updateValue,
		};
	});
};
