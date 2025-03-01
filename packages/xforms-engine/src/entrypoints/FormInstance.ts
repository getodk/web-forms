import { identity } from '@getodk/common/lib/identity.ts';
import type {
	FormInstance as ClientFormInstance,
	FormInstanceInitializationMode,
} from '../client/form/FormInstance.ts';
import type { FormInstanceConfig } from '../client/index.ts';
import type { InstanceConfig } from '../instance/internal-api/InstanceConfig.ts';
import type { PrimaryInstanceOptions } from '../instance/PrimaryInstance.ts';
import { PrimaryInstance } from '../instance/PrimaryInstance.ts';
import type { Root } from '../instance/Root.ts';

export interface FormInstanceBaseOptions extends Omit<PrimaryInstanceOptions, 'config'> {}

export class FormInstance<Mode extends FormInstanceInitializationMode>
	implements ClientFormInstance<Mode>
{
	readonly root: Root;

	constructor(
		readonly mode: Mode,
		baseOptions: FormInstanceBaseOptions,
		baseConfig?: FormInstanceConfig
	) {
		const config: InstanceConfig = {
			clientStateFactory: baseConfig?.stateFactory ?? identity,
		};
		const primaryInstanceOptions: PrimaryInstanceOptions = {
			...baseOptions,
			config,
		};
		const { root } = new PrimaryInstance(primaryInstanceOptions);

		this.root = root;
	}
}
