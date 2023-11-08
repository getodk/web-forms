import {
	ENKETO_NAMESPACE_URI,
	FN_NAMESPACE_URI,
	JAVAROSA_NAMESPACE_URI,
	XFORMS_NAMESPACE_URI,
} from '../evaluator/NamespaceResolver.ts';
import { FunctionLibrary } from '../evaluator/functions/FunctionLibrary.ts';
import * as enketoImplementations from './enketo/index.ts';
import * as fnImplementations from './fn/index.ts';
import * as javarosaImplementations from './javarosa/index.ts';
import * as xformsImplementations from './xforms/index.ts';

export const enketoFunctionLibrary = new FunctionLibrary(
	ENKETO_NAMESPACE_URI,
	Object.entries(enketoImplementations)
);

export const fnFunctionLibrary = new FunctionLibrary(
	FN_NAMESPACE_URI,
	Object.entries(fnImplementations)
);

export const javarosaFunctionLibrary = new FunctionLibrary(
	JAVAROSA_NAMESPACE_URI,
	Object.entries(javarosaImplementations)
);

export const xformsFunctionLibrary = new FunctionLibrary(
	XFORMS_NAMESPACE_URI,
	Object.entries(xformsImplementations)
);
