import type {
	CreatedFormInstance,
	FormInstanceConfig,
	LoadFormOptions,
	LoadFormResult,
	LoadFormSuccessResult,
	LoadFormWarningResult,
	RestoredFormInstance,
} from '@getodk/xforms-engine';
import { loadForm } from '@getodk/xforms-engine';
import type { Ref } from 'vue';
import { computed, reactive, ref } from 'vue';
import type { AnyInstancePayload } from './instance-cache-state.ts';

// prettier-ignore
export type InstantiableFormResult =
	| LoadFormSuccessResult
	| LoadFormWarningResult;

export const formResultState: Ref<LoadFormResult | null> = ref(null);

const isInstantiableFormResult = (
	formResult: LoadFormResult | null
): formResult is InstantiableFormResult => {
	return formResult != null && formResult.status !== 'failure';
};

export const instantiableFormResult = computed(() => {
	const formResult = formResultState.value;

	if (isInstantiableFormResult(formResult)) {
		return formResult;
	}

	return null;
});

export const initializeFormResultState = async (
	formXML: string,
	options: LoadFormOptions
): Promise<LoadFormResult> => {
	const formResult = await loadForm(formXML, options);

	formResultState.value = formResult;

	return formResult;
};

const instanceConfig: FormInstanceConfig = {
	stateFactory: reactive,
};

// prettier-ignore
export type AnyInstance =
	| CreatedFormInstance
	| RestoredFormInstance;

export const instanceState: Ref<AnyInstance | null> = ref(null);

export const initializeInstanceState = (
	formResult: InstantiableFormResult
): CreatedFormInstance => {
	const instance = formResult.createInstance(instanceConfig);

	instanceState.value = instance;

	return instanceState.value;
};

interface FormInstanceState {
	readonly formResult: LoadFormResult;
	readonly instance: AnyInstance;
}

export const initializeFormInstanceState = async (
	formXML: string,
	options: LoadFormOptions
): Promise<FormInstanceState | null> => {
	const formResult = await initializeFormResultState(formXML, options);

	if (formResult.status === 'failure') {
		instanceState.value = null;

		return null;
	}

	const instance = initializeInstanceState(formResult);

	return {
		formResult,
		instance,
	};
};

export const restoreInstanceState = async (
	formResult: InstantiableFormResult,
	payload: AnyInstancePayload
): Promise<AnyInstance> => {
	const instance = await formResult.restoreInstance(payload, instanceConfig);

	instanceState.value = instance;

	return instance;
};

export const resetInstanceState = () => {
	const formResult = formResultState.value;

	if (isInstantiableFormResult(formResult)) {
		initializeInstanceState(formResult);
	}
};

export const resetFormInstanceState = () => {
	formResultState.value = null;
	instanceState.value = null;
};
