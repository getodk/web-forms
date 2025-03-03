import type { CreateFormInstance } from '../../client/form/CreateFormInstance.ts';
import type { FormInstanceConfig } from '../../client/form/FormInstanceConfig.ts';
import type {
	RestoreFormInstance,
	RestoreFormInstanceInput,
} from '../../client/form/RestoreFormInstance.ts';
import { InitialInstanceState } from '../../instance/input/InitialInstanceState.ts';
import type { BasePrimaryInstanceOptions } from '../../instance/PrimaryInstance.ts';
import type { FormResource } from '../../instance/resource.ts';
import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import { FormInstance } from '../FormInstance.ts';
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
	readonly instanceOptions: BasePrimaryInstanceOptions;
}

export abstract class BaseInstantiableFormResult<
	Status extends InstantiableFormResultStatus,
> extends BaseFormResult<Status> {
	readonly createInstance: CreateFormInstance;
	readonly restoreInstance: RestoreFormInstance;

	constructor(options: InstantiableFormResultOptions<Status>) {
		const { status, warnings, error, instanceOptions } = options;

		super({
			status,
			warnings,
			error,
		});

		this.createInstance = (instanceConfig: FormInstanceConfig = {}) => {
			return new FormInstance({
				mode: 'create',
				instanceOptions,
				initialState: null,
				instanceConfig,
			});
		};

		this.restoreInstance = async (
			input: RestoreFormInstanceInput,
			instanceConfig: FormInstanceConfig = {}
		) => {
			const initialState = await InitialInstanceState.from(input.data);

			return new FormInstance({
				mode: 'restore',
				instanceOptions,
				initialState,
				instanceConfig,
			});
		};
	}
}
