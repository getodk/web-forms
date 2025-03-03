import { identity } from '@getodk/common/lib/identity.ts';
import type {
	FormInstance as ClientFormInstance,
	FormInstanceInitializationMode,
} from '../client/form/FormInstance.ts';
import type { FormInstanceConfig } from '../client/index.ts';
import type { InstanceConfig } from '../instance/internal-api/InstanceConfig.ts';
import type {
	BasePrimaryInstanceOptions,
	PrimaryInstanceInitialState,
	PrimaryInstanceOptions,
} from '../instance/PrimaryInstance.ts';
import { PrimaryInstance } from '../instance/PrimaryInstance.ts';
import type { Root } from '../instance/Root.ts';

interface FormInstanceOptions<Mode extends FormInstanceInitializationMode> {
	readonly mode: Mode;
	readonly initialState: PrimaryInstanceInitialState<Mode>;
	readonly instanceOptions: BasePrimaryInstanceOptions;
	readonly instanceConfig: FormInstanceConfig;
}

export class FormInstance<Mode extends FormInstanceInitializationMode>
	implements ClientFormInstance<Mode>
{
	readonly mode: Mode;
	readonly root: Root;

	constructor(options: FormInstanceOptions<Mode>) {
		const { mode, initialState } = options;
		const config: InstanceConfig = {
			clientStateFactory: options.instanceConfig?.stateFactory ?? identity,
		};
		const primaryInstanceOptions: PrimaryInstanceOptions<Mode> = {
			...options.instanceOptions,
			mode,
			initialState,
			config,
		};
		const { root } = new PrimaryInstance(primaryInstanceOptions);

		this.mode = mode;
		this.root = root;
	}
}
