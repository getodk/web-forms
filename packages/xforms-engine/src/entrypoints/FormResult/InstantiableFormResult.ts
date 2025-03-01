import type { CreateFormInstance } from '../../client/form/CreateFormInstance.ts';
import type { FormInstanceConfig } from '../../client/form/FormInstanceConfig.ts';
import type { FormResource } from '../../instance/resource.ts';
import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import { FormInstance, type FormInstanceBaseOptions } from '../FormInstance.ts';
import type { BaseFormResultProperty } from './BaseFormResult.ts';
import { BaseFormResult } from './BaseFormResult.ts';

// prettier-ignore
type InstantiableFormResultStatus =
	| 'success'
	| 'warning';

export interface InstantiableFormResultOptions<Status extends InstantiableFormResultStatus> {
	readonly status: Status;
	readonly warnings: BaseFormResultProperty<Status, 'warnings'>;
	readonly error: null;
	readonly scope: ReactiveScope;
	readonly formResource: FormResource;
	readonly instanceOptions: FormInstanceBaseOptions;
}

export abstract class BaseInstantiableFormResult<
	Status extends InstantiableFormResultStatus,
> extends BaseFormResult<Status> {
	readonly createInstance: CreateFormInstance;

	constructor(options: InstantiableFormResultOptions<Status>) {
		const { status, warnings, error, instanceOptions } = options;

		super({
			status,
			warnings,
			error,
		});

		this.createInstance = (config?: FormInstanceConfig) => {
			return new FormInstance('create', instanceOptions, config);
		};
	}
}
