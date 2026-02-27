const DECIMAL_FORMATTER = new Intl.NumberFormat('en-US', {
	minimumFractionDigits: 1,
	useGrouping: false,
});

export const parseToInteger = (value: string | null): number | null => {
	if (value === null) {
		return null;
	}

	const parsed = Number(value);
	if (typeof value !== 'string' || value.trim() === '' || !Number.isInteger(parsed)) {
		throw new Error(`Expected an integer, but got: ${value}`);
	}

	return parsed;
};

export const parseToFloat = (value: string | null): number | null => {
	if (value === null) {
		return null;
	}

	const parsed = Number(value);
	if (typeof value !== 'string' || value.trim() === '' || Number.isNaN(parsed)) {
		throw new Error(`Expected a float, but got: ${value}`);
	}

	return parsed;
};

export const formatDecimal = (value: number): string => {
	return DECIMAL_FORMATTER.format(value);
};
