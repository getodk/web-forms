import { createComputed, createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	engineClientState,
	type EngineClientState,
} from '../../../src/lib/reactivity/engine-client-state.ts';
import { createReactiveScope, type ReactiveScope } from '../../../src/lib/reactivity/scope.ts';
import { reactiveScope } from '../../helpers/reactive/internal.ts';

describe('Engine/Client state', () => {
	let rootScope: ReactiveScope;

	interface TestState {
		get readonly(): boolean;
		get relevant(): boolean;
		get required(): boolean;
	}

	let state: EngineClientState<TestState> | null;

	beforeEach(() => {
		rootScope = createReactiveScope();
		state = null;
	});

	afterEach(() => {
		state?.scope.dispose();
		rootScope.dispose();
	});

	const initialStates: readonly TestState[] = [
		{
			readonly: true,
			relevant: false,
			required: true,
		},
		{
			readonly: false,
			relevant: true,
			required: false,
		},
	];

	it.each(initialStates)(
		'creates engine state with the values from its input: %j',
		(initialState) => {
			rootScope.runTask(() => {
				expect.assertions(1);

				reactiveScope(({ mutable }) => {
					state = engineClientState(mutable, initialState);

					expect(state.engineState).toEqual(initialState);
				});
			});
		}
	);

	it.each(initialStates)(
		'creates client state with the values from its input: %j',
		(initialState) => {
			expect.assertions(1);

			rootScope.runTask(() => {
				reactiveScope(({ mutable }) => {
					state = engineClientState(mutable, initialState);

					expect(state.clientState).toEqual(initialState);
				});
			});
		}
	);

	it('stores value updates on the engine state', () => {
		expect.assertions(3);

		rootScope.runTask(() => {
			reactiveScope(({ mutable }) => {
				state = engineClientState(mutable, {
					readonly: false,
					relevant: false,
					required: false,
				});

				state.updateValue('readonly', true);

				expect(state.engineState).toEqual({
					readonly: true,
					relevant: false,
					required: false,
				});

				state.updateValue('relevant', true);

				expect(state.engineState).toEqual({
					readonly: true,
					relevant: true,
					required: false,
				});

				state.updateValue('required', true);

				expect(state.engineState).toEqual({
					readonly: true,
					relevant: true,
					required: true,
				});
			});
		});
	});

	it('reflects value updates on the client state', () => {
		expect.assertions(3);

		rootScope.runTask(() => {
			reactiveScope(({ mutable }) => {
				state = engineClientState(mutable, {
					readonly: false,
					relevant: false,
					required: false,
				});

				state.updateValue('readonly', true);

				expect(state.clientState).toEqual({
					readonly: true,
					relevant: false,
					required: false,
				});

				state.updateValue('relevant', true);

				expect(state.clientState).toEqual({
					readonly: true,
					relevant: true,
					required: false,
				});

				state.updateValue('required', true);

				expect(state.clientState).toEqual({
					readonly: true,
					relevant: true,
					required: true,
				});
			});
		});
	});

	// While this is presently discouraged, we want to test that it's possible in
	// case we find the update mechanism lacking or superfluous.
	it('reflects direct updates to engine state on the client state', () => {
		expect.assertions(3);

		rootScope.runTask(() => {
			reactiveScope(({ mutable }) => {
				state = engineClientState(mutable, {
					readonly: false,
					relevant: false,
					required: false,
				});

				state.engineState.readonly = true;

				expect(state.clientState).toEqual({
					readonly: true,
					relevant: false,
					required: false,
				});

				state.engineState.relevant = true;

				expect(state.clientState).toEqual({
					readonly: true,
					relevant: true,
					required: false,
				});

				state.engineState.required = true;

				expect(state.clientState).toEqual({
					readonly: true,
					relevant: true,
					required: true,
				});
			});
		});
	});

	describe('accessors', () => {
		it('derives computed get accessors from the input object on the engine state', () => {
			expect.assertions(2);

			rootScope.runTask(() => {
				reactiveScope(({ mutable }) => {
					const [isReadonly, setIsReadonly] = createSignal(false);

					state = engineClientState(mutable, {
						get readonly() {
							return isReadonly();
						},
						relevant: false,
						required: true,
					});

					expect(state.engineState.readonly).toBe(false);

					setIsReadonly(true);

					expect(state.engineState.readonly).toBe(true);
				});
			});
		});

		it('derives computed get accessors from the input object on the client state', () => {
			expect.assertions(2);

			rootScope.runTask(() => {
				reactiveScope(({ mutable }) => {
					const [isReadonly, setIsReadonly] = createSignal(false);

					state = engineClientState(mutable, {
						get readonly() {
							return isReadonly();
						},
						relevant: false,
						required: true,
					});

					expect(state.clientState.readonly).toBe(false);

					setIsReadonly(true);

					expect(state.clientState.readonly).toBe(true);
				});
			});
		});

		it('prevents writes to get accessors derived from the input object', () => {
			expect.assertions(5);

			rootScope.runTask(() => {
				reactiveScope(({ mutable }) => {
					state = engineClientState(mutable, {
						get readonly() {
							return true;
						},
						relevant: false,
						required: true,
					});

					expect(state.engineState.readonly).toBe(true);
					expect(state.clientState.readonly).toBe(true);

					try {
						state.updateValue('readonly', false);
						expect.fail();
					} catch (error) {
						expect(error).toBeInstanceOf(TypeError);
					}

					expect(state.engineState.readonly).toBe(true);
					expect(state.clientState.readonly).toBe(true);
				});
			});
		});
	});

	describe('engine reactivity', () => {
		interface ObservedStates {
			readonly readonly: boolean[];
			readonly relevant: boolean[];
			readonly required: boolean[];
		}

		// Note "as they occur" is a bit more nuanced than one might expect. By
		// default, Solid's effects are batched. We use `createComputed` to *fully
		// synchronously* observe each change as it occurs.
		it('triggers reactive effects in the engine as state changes occur', () => {
			expect.assertions(5);

			rootScope.runTask(() => {
				reactiveScope(({ mutable }) => {
					state = engineClientState(mutable, {
						readonly: false,
						relevant: false,
						required: false,
					});

					// Destructured here so these aren't nullish in callbacks (since
					// `state` itself is nullable)
					const { engineState, scope, updateValue } = state;

					scope.runTask(() => {
						const observedStates: ObservedStates = {
							readonly: [],
							relevant: [],
							required: [],
						};

						createComputed(() => {
							observedStates.readonly.push(engineState.readonly);
						});

						createComputed(() => {
							observedStates.relevant.push(engineState.relevant);
						});

						createComputed(() => {
							observedStates.required.push(engineState.required);
						});

						expect(observedStates).toEqual({
							readonly: [false],
							relevant: [false],
							required: [false],
						});

						updateValue('readonly', true);

						expect(observedStates).toEqual({
							readonly: [false, true],
							relevant: [false],
							required: [false],
						});

						updateValue('required', true);

						expect(observedStates).toEqual({
							readonly: [false, true],
							relevant: [false],
							required: [false, true],
						});

						updateValue('readonly', false);

						expect(observedStates).toEqual({
							readonly: [false, true, false],
							relevant: [false],
							required: [false, true],
						});

						updateValue('relevant', true);

						expect(observedStates).toEqual({
							readonly: [false, true, false],
							relevant: [false, true],
							required: [false, true],
						});
					});
				});
			});
		});
	});

	describe('client reactivity', () => {
		interface ObservedStates {
			readonly readonly: boolean[];
			readonly relevant: boolean[];
			readonly required: boolean[];
		}

		// Note "as they occur" is a bit more nuanced than one might expect. By
		// default, Solid's effects are batched. We use `createComputed` to *fully
		// synchronously* observe each change as it occurs.
		it('triggers reactive effects in the engine as state changes occur', () => {
			expect.assertions(5);

			rootScope.runTask(() => {
				reactiveScope(({ mutable, effect }) => {
					state = engineClientState(mutable, {
						readonly: false,
						relevant: false,
						required: false,
					});

					// Destructured here so these aren't nullish in callbacks (since
					// `state` itself is nullable)
					const { clientState, scope, updateValue } = state;

					scope.runTask(() => {
						const observedStates: ObservedStates = {
							readonly: [],
							relevant: [],
							required: [],
						};

						effect(() => {
							observedStates.readonly.push(clientState.readonly);
						});

						effect(() => {
							observedStates.relevant.push(clientState.relevant);
						});

						effect(() => {
							observedStates.required.push(clientState.required);
						});

						expect(observedStates).toEqual({
							readonly: [false],
							relevant: [false],
							required: [false],
						});

						updateValue('readonly', true);

						expect(observedStates).toEqual({
							readonly: [false, true],
							relevant: [false],
							required: [false],
						});

						updateValue('required', true);

						expect(observedStates).toEqual({
							readonly: [false, true],
							relevant: [false],
							required: [false, true],
						});

						updateValue('readonly', false);

						expect(observedStates).toEqual({
							readonly: [false, true, false],
							relevant: [false],
							required: [false, true],
						});

						updateValue('relevant', true);

						expect(observedStates).toEqual({
							readonly: [false, true, false],
							relevant: [false, true],
							required: [false, true],
						});
					});
				});
			});
		});
	});
});
