/* eslint-disable no-console */
/**
 * Derived from
 * {@link https://github.com/solidjs/solid-testing-library/blob/805c3f70961d956d1ffacb08d435535e71d50398/src/index.ts}
 *
 * Modified to:
 *
 * - Make access to Node's global `process` object optional, allowing use in
 *   browser environments
 * - Address type strictness errors (as with {@link ./types.ts}, largely by
 *   loosening types)
 * - Use non-global `afterEach` for cleanup
 */

/// <reference types="@testing-library/jest-dom" />

import { getQueriesForElement, prettyDOM } from '@testing-library/dom';
import type { Accessor, Owner } from 'solid-js';
import {
	createComponent,
	createRoot,
	createSignal,
	getOwner,
	lazy,
	onError,
	onMount,
	runWithOwner,
} from 'solid-js';
import { hydrate as solidHydrate, render as solidRender } from 'solid-js/web';

import type {
	Options,
	Ref,
	RenderDirectiveOptions,
	RenderDirectiveResult,
	RenderHookOptions,
	RenderHookResult,
	Result,
	Ui,
} from './types.ts';

type Process = typeof import('node:process');

declare global {
	// eslint-disable-next-line no-var
	var afterEach: ((callback: () => Promise<void> | void) => void) | undefined;

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore -- overriding the built-in node types has proved surprisingly difficult D:
	// eslint-disable-next-line no-var
	var process: Process | undefined;
}

const { afterEach } = globalThis;

/* istanbul ignore next */
if (!globalThis.process?.env.STL_SKIP_AUTO_CLEANUP) {
	if (typeof afterEach === 'function') {
		afterEach(() => {
			cleanup();
		});
	}
}

const mountedContainers = new Set<Ref>();

/**
 * Renders a component to test it
 * @param ui {Ui} a function calling the component
 * @param options {Options} test options
 * @returns {Result} references and tools to test the component
 *
 * ```ts
 * const { getByText } = render(() => <App />, { wrapper: I18nProvider });
 * const button = getByText('Accept');
 * ```
 * ### Options
 * - `options.container` - the HTML element which the UI will be rendered into; otherwise a `<div>` will be created
 * - `options.baseElement` - the parent of the container, the default will be `<body>`
 * - `options.queries` - custom queries (see https://testing-library.com/docs/queries/about)
 * - `options.hydrate` - `true` if you want to test hydration
 * - `options.wrapper` - a component that applies a context provider and returns `props.children`
 * - `options.location` - wraps the component in a solid-router with memory integration pointing at the given path
 *
 * ### Result
 * - `result.asFragment()` - returns the HTML fragment as string
 * - `result.container` - the container in which the component is rendered
 * - `result.baseElement` - the parent of the component
 * - `result.debug()` - returns helpful debug output on the console
 * - `result.unmount()` - unmounts the component, usually automatically called in cleanup
 * - `result.`[queries] - testing library queries, see https://testing-library.com/docs/queries/about)
 */
function render(ui: Ui, options: Options = {}): Result {
	const { queries, hydrate = false, location, wrapper } = options;
	let { container, baseElement = container } = options;

	if (!baseElement) {
		// Default to document.body instead of documentElement to avoid output of potentially-large
		// head elements (such as JSS style blocks) in debug output.
		baseElement = document.body;
	}

	if (!container) {
		container = baseElement.appendChild(document.createElement('div'));
	}

	const wrappedUi: Ui =
		typeof wrapper === 'function'
			? () =>
					createComponent(wrapper, {
						get children() {
							return createComponent(ui, {});
						},
					})
			: ui;

	const routedUi: Ui =
		typeof location === 'string' || typeof options.routeDataFunc === 'function'
			? lazy(async () => {
					try {
						const { memoryIntegration, useNavigate, Router } = await import('@solidjs/router');
						return {
							default: () =>
								createComponent(Router, {
									get children() {
										return [
											typeof location === 'string'
												? createComponent(
														() => (useNavigate()(location, { replace: true, scroll: false }), null),
														{}
												  )
												: null,
											createComponent(wrappedUi, {}),
										];
									},
									// Ideally this wouldn't be `!` asserted, but it works around
									// lack of `undefined` in underlying types (accommodation for
									// `exactOptionalPropertyTypes` TypeScript config)
									data: options.routeDataFunc!,
									get source() {
										return memoryIntegration();
									},
								}),
						};
					} catch (e) {
						console.error(
							`Error attempting to initialize @solidjs/router:\n"${
								(e as Partial<Error>)?.message ?? 'unknown error'
							}"`
						);
						return { default: () => createComponent(wrappedUi, {}) };
					}
			  })
			: wrappedUi;

	const dispose = hydrate
		? (solidHydrate(routedUi, container) as unknown as () => void)
		: solidRender(routedUi, container);

	// We'll add it to the mounted containers regardless of whether it's actually
	// added to document.body so the cleanup method works regardless of whether
	// they're passing us a custom container or not.
	mountedContainers.add({ container, dispose });

	const queryHelpers = getQueriesForElement(container, queries);

	return {
		asFragment: () => container?.innerHTML,
		container,
		baseElement,
		debug: (el = baseElement, maxLength, debugOptions) =>
			Array.isArray(el)
				? el.forEach((e) => console.log(prettyDOM(e, maxLength, debugOptions)))
				: console.log(prettyDOM(el, maxLength, debugOptions)),
		unmount: dispose,
		...queryHelpers,
	} as Result;
}

/**
 * "Renders" a hook to test it
 * @param hook {() => unknown)} a hook or primitive
 * @param options {RenderHookOptions} test options
 * @returns {RenderHookResult} references and tools to test the hook/primitive
 *
 * ```ts
 * const { result } = render(useI18n, { wrapper: I18nProvider });
 * expect(result.t('test')).toBe('works');
 * ```
 * ### Options
 * - `options.initialProps` - an array with the props that the hook will be provided with.
 * - `options.wrapper` - a component that applies a context provider and **always** returns `props.children`
 *
 * ### Result
 * - `result.result` - the return value of the hook/primitive
 * - `result.owner` - the reactive owner in which the hook is run (in order to run other reactive code in the same context with [`runWithOwner`](https://www.solidjs.com/docs/latest/api#runwithowner))
 * - `result.cleanup()` - calls the cleanup function of the hook/primitive
 */
export function renderHook<A extends unknown[], R>(
	hook: (...args: A) => R,
	options?: RenderHookOptions<A>
): RenderHookResult<R> {
	const initialProps: A | [] = Array.isArray(options) ? options : options?.initialProps ?? [];
	const [dispose, owner, result] = createRoot((disposeRoot) => {
		if (
			typeof options === 'object' &&
			'wrapper' in options &&
			typeof options.wrapper === 'function'
		) {
			let hookResult: ReturnType<typeof hook> | undefined;

			options.wrapper({
				get children() {
					return createComponent(() => {
						hookResult = hook(...(initialProps as A));
						return null;
					}, {});
				},
			});
			return [disposeRoot, getOwner(), hookResult];
		}
		return [disposeRoot, getOwner(), hook(...(initialProps as A))];
	});

	mountedContainers.add({ dispose });

	return { result, cleanup: dispose, owner };
}

/**
 * Applies a directive to a test container
 * @param directive {(ref, value: () => unknown)} a reusable custom directive
 * @param options {RenderDirectiveOptions} test options
 * @returns {RenderDirectiveResult} references and tools to test the directive
 *
 * ```ts
 * const called = vi.fn()
 * const { getByText, baseContainer } = render(onClickOutside, { initialValue: called });
 * expect(called).not.toBeCalled();
 * fireEvent.click(baseContainer);
 * expect(called).toBeCalled();
 * ```
 * ### Options
 * - `options.initialValue` - a value added to the directive
 * - `options.targetElement` - the name of a HTML element as a string or a HTMLElement or a function returning a HTMLElement
 * - `options.container` - the HTML element which the UI will be rendered into; otherwise a `<div>` will be created
 * - `options.baseElement` - the parent of the container, the default will be `<body>`
 * - `options.queries` - custom queries (see https://testing-library.com/docs/queries/about)
 * - `options.hydrate` - `true` if you want to test hydration
 * - `options.wrapper` - a component that applies a context provider and returns `props.children`
 *
 * ### Result
 * - `result.arg()` - the accessor for the value that the directive receives
 * - `result.setArg()` - the setter for the value that the directive receives
 * - `result.asFragment()` - returns the HTML fragment as string
 * - `result.container` - the container in which the component is rendered
 * - `result.baseElement` - the parent of the component
 * - `result.debug()` - returns helpful debug output on the console
 * - `result.unmount()` - unmounts the component, usually automatically called in cleanup
 * - `result.`[queries] - testing library queries, see https://testing-library.com/docs/queries/about)
 */
export function renderDirective<A, U extends A, E extends HTMLElement>(
	directive: (ref: E, arg: Accessor<U>) => void,
	options?: RenderDirectiveOptions<U, E>
): RenderDirectiveResult<U> {
	const [arg, setArg] = createSignal<U>(options?.initialValue as U);

	return Object.assign(
		render(() => {
			const targetElement =
				(options?.targetElement &&
					(options.targetElement instanceof HTMLElement
						? options.targetElement
						: typeof options.targetElement === 'string'
						? document.createElement(options.targetElement)
						: typeof options.targetElement === 'function'
						? options.targetElement()
						: undefined)) ??
				document.createElement('div');
			onMount(() => directive(targetElement as E, arg));
			return targetElement;
		}, options),
		{ arg, setArg }
	);
}

export function testEffect<T = void>(
	fn: (done: (result: T) => void) => void,
	owner?: Owner
): Promise<T> {
	const context: {
		promise?: Promise<T>;
		done?: (result: T) => void;
		fail?: (error: unknown) => void;
		dispose?: () => void;
	} = {};
	context.promise = new Promise<T>((resolve, reject) => {
		context.done = resolve;
		context.fail = reject;
	});
	context.dispose = createRoot((dispose) => {
		onError((err) => context.fail?.(err));
		(owner ? (done: (result: T) => void) => runWithOwner(owner, () => fn(done)) : fn)((result) => {
			context.done?.(result);
			dispose();
		});
		return dispose;
	});
	return context.promise;
}

function cleanupAtContainer(ref: Ref) {
	const { container, dispose } = ref;
	dispose();

	if (container?.parentNode === document.body) {
		document.body.removeChild(container);
	}

	mountedContainers.delete(ref);
}

function cleanup() {
	mountedContainers.forEach(cleanupAtContainer);
}

export * from '@testing-library/dom';
export { cleanup, render };
