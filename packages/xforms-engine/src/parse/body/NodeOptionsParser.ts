export const parseToInteger = (value: string | null) => {
	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`Expected a non-empty string, but got: ${value}`);
	}

	const parsed = Number(value);
	if (!Number.isInteger(parsed)) {
		throw new Error(`Expected an integer, but got: ${value}`);
	}

	return parsed;
};

export const parseToFloat = (value: string | null) => {
	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`Expected a non-empty string, but got: ${value}`);
	}

	const parsed = Number(value);
	if (isNaN(parsed)) {
		throw new Error(`Expected a float, but got: ${value}`);
	}

	return parsed;
};
