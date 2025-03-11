import type { LoadFormWarningResult, LoadFormWarnings } from '../../client/form/LoadFormResult.ts';
import type { FormResource } from '../../instance/resource.ts';
import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { FormInstanceBaseOptions } from '../FormInstance.ts';
import { BaseInstantiableFormResult } from './BaseInstantiableFormResult.ts';

export interface FormWarningResultOptions {
	readonly warnings: LoadFormWarnings;
	readonly error: null;
	readonly scope: ReactiveScope;
	readonly formResource: FormResource;
	readonly instanceOptions: FormInstanceBaseOptions;
}

export class FormWarningResult
	extends BaseInstantiableFormResult<'warning'>
	implements LoadFormWarningResult
{
	constructor(options: FormWarningResultOptions) {
		super({
			status: 'warning',
			...options,
		});
	}
}
