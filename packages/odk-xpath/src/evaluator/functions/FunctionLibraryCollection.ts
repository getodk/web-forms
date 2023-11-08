import type { Context } from '../../context/Context.ts';
import {
	ENKETO_NAMESPACE_URI,
	FN_NAMESPACE_URI,
	XFORMS_NAMESPACE_URI,
} from '../NamespaceResolver.ts';
import type { FunctionImplementation } from './FunctionImplementation.ts';
import type { FunctionLibrary } from './FunctionLibrary.ts';

class UnknownFunctionLibraryError extends Error {
	constructor(namespaceURI: string) {
		super(`Unknown function library for namespace ${namespaceURI}`);
	}
}

interface BaseFunctionNameLookup {
	readonly namespaceURI?: string | null;
	readonly prefix?: string | null;
	readonly localName: string;
}

interface NamespacedFunctionNameLookup extends BaseFunctionNameLookup {
	readonly namespaceURI: string | null;
}

interface PrefixedFunctionNameLookup extends BaseFunctionNameLookup {
	readonly prefix: string | null;
}

type FunctionNameLookup = NamespacedFunctionNameLookup | PrefixedFunctionNameLookup;

export class FunctionLibraryCollection {
	/**
	 * Default function libraries determine, for a given Evaluator instance and
	 * its corresponding FunctionLibraryMap instance, which function calls may
	 * resolved without a prefix.
	 *
	 * Unprefixed functions are looked up by local name in each successive default library until one is matched. In other words,
	 */
	protected readonly defaultFunctionLibraries: readonly FunctionLibrary[];

	protected readonly namespacedFunctionLibraries: ReadonlyMap<string, FunctionLibrary>;

	constructor(
		functionLibraries: Iterable<FunctionLibrary>,
		// TODO: defaulting to handle XForms and Enketo functions and extensions
		// is pragmatic, but longer term we'll ideally make those extensions
		// explicit. Making this argument optional is part of easing that if we
		// decide to prioritize it.
		protected readonly defaultNamespaceURIs: readonly string[] = [
			// TODO: hopefully temporary, but must come before XForms functions for
			// the cases where its behavior diverges (e.g. `date-format` as alias to
			// `date-time-format`)
			ENKETO_NAMESPACE_URI,

			// Where XForms namespaced functions are available, they are prioritized
			// before standard (fn) namespaced functions, as they override some
			// built-in behavior (e.g. date/datetime casting in applicable functions).
			XFORMS_NAMESPACE_URI,

			FN_NAMESPACE_URI,

			// Note: intentionally call out that JavaRosa namespaced functions *must*
			// be prefixed in evaluated expressions, consistent with ODK XForms spec.
			// JAVAROSA_NAMESPACE_URI,
		]
	) {
		const namespacedFunctionLibraries = new Map<string, FunctionLibrary>();

		for (const functionLibrary of functionLibraries) {
			const { namespaceURI } = functionLibrary;

			if (namespacedFunctionLibraries.has(namespaceURI)) {
				throw new Error(`Multiple function libraries for namespace: ${namespaceURI}`);
			}

			namespacedFunctionLibraries.set(namespaceURI, functionLibrary);
		}

		this.namespacedFunctionLibraries = namespacedFunctionLibraries;

		this.defaultFunctionLibraries = defaultNamespaceURIs.map((namespaceURI) => {
			const functionLibrary = namespacedFunctionLibraries.get(namespaceURI);

			if (functionLibrary == null) {
				throw new Error(`No function library for default namespace: ${namespaceURI}`);
			}

			return functionLibrary;
		});
	}

	getDefaultImplementation(localName: string): FunctionImplementation<number> | null {
		for (const functionLibrary of this.defaultFunctionLibraries) {
			const functionImplementation = functionLibrary.getImplementation(localName);

			if (functionImplementation != null) {
				return functionImplementation;
			}
		}

		return null;
	}

	getImplementation(
		context: Context,
		name: FunctionNameLookup
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	): FunctionImplementation<any> | null {
		const { localName, namespaceURI, prefix } = name;

		const resolvedNamespaceURI =
			namespaceURI ?? context.namespaceResolver.lookupNamespaceURI(prefix ?? FN_NAMESPACE_URI);

		if (resolvedNamespaceURI == null) {
			return this.getDefaultImplementation(localName);
		}

		const functionLibrary = this.namespacedFunctionLibraries.get(resolvedNamespaceURI);

		if (functionLibrary == null) {
			throw new UnknownFunctionLibraryError(resolvedNamespaceURI);
		}

		return functionLibrary.getImplementation(localName);
	}
}
