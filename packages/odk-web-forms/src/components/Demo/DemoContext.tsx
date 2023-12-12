import type { Accessor, JSX } from 'solid-js';
import { createContext, createSignal } from 'solid-js';
import type { FormUploadResult } from './FormUploader.tsx';

export interface DemoContextState {
	readonly reset: () => void;
	readonly formUpload: Accessor<FormUploadResult | null>;
	readonly isUploadInProgress: Accessor<boolean>;
	readonly setUploadInProgress: () => true;
	readonly uploadForm: (uploaded: FormUploadResult) => FormUploadResult;
}

export const DemoContext = createContext<DemoContextState>({
	reset: () => {
		throw new Error('Use DemoContextProvider');
	},
	formUpload: () => null,
	isUploadInProgress: () => false,
	setUploadInProgress: () => {
		throw new Error('Use DemoContextProvider');
	},
	uploadForm: () => {
		throw new Error('Use DemoContextProvider');
	},
});

interface DemoContextProviderProps {
	readonly children: JSX.Element;
}

export const DemoContextProvider = (props: DemoContextProviderProps) => {
	const [isUploadInProgress, setUploadInProgress] = createSignal(false);
	const [formUpload, setFormUpload] = createSignal<FormUploadResult | null>(null);
	const reset = () => {
		setFormUpload(null);
		setUploadInProgress(false);
	};
	const uploadForm = (uploaded: FormUploadResult): FormUploadResult => {
		setUploadInProgress(false);

		return setFormUpload(() => uploaded);
	};

	return (
		<DemoContext.Provider
			value={{
				reset,
				isUploadInProgress,
				setUploadInProgress: () => {
					return setUploadInProgress(true);
				},
				formUpload,
				uploadForm,
			}}
		>
			{props.children}
		</DemoContext.Provider>
	);
};
