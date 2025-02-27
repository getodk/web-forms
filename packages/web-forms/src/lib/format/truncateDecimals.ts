export const truncateDecimals = (num: number, decimals = 3): string => {
	if (
		typeof num !== 'number' ||
		Number.isNaN(num) ||
		typeof decimals !== 'number' ||
		Number.isNaN(decimals)
	) {
		return '';
	}

	if (Number.isInteger(num) || decimals <= 0) {
		return num.toString();
	}

	const factor = Math.pow(10, decimals);
	const withDecimals = Math.floor(Math.abs(num) * factor) / factor;
	return (num < 0 ? -withDecimals : withDecimals).toString();
};
