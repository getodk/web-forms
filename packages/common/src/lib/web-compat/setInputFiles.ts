const initDataTransfer = (): DataTransfer | null => {
	if (typeof globalThis.DataTransfer === 'function') {
		return new DataTransfer();
	}

	return null;
};

interface FileListInstance extends FileList {
	readonly constructor: typeof FileList;
}

export const setInputFiles = (input: HTMLInputElement, files: readonly File[]): void => {
	const dataTransfer = initDataTransfer();

	if (dataTransfer == null) {
		const descriptors = files.reduce<Record<number, PropertyDescriptor>>((result, value, index) => {
			result[index] = { value };

			return result;
		}, {});

		let fileList: FileListInstance | null =
			input.files satisfies FileList | null as FileListInstance | null;

		if (fileList == null) {
			throw new Error(
				'Failed to set input files. Expected `input.files` to be a FileList, got: null'
			);
		}

		fileList = Object.create(fileList.constructor.prototype, descriptors) as FileListInstance;

		if (!(fileList instanceof fileList.constructor)) {
			throw new Error('Failed to create FileList with provided files');
		}

		Object.defineProperty(input, 'files', {
			value: fileList,
		});
	} else {
		for (const file of files) {
			dataTransfer.items.add(file);
		}

		input.files = dataTransfer.files;
	}
};
