interface LocalURLOptions {
	readonly path: string;
	readonly query?: Map<string, string> | Record<string, string>;
}

export const localURL = (options: LocalURLOptions) => {
	const { origin } = window.location;
	const { path, query = {} } = options;
	const queryEntries = query instanceof Map ? query.entries() : Object.entries(query);
	const url = new URL(path, origin);
	const { searchParams } = url;

	for (const [key, value] of queryEntries) {
		searchParams.set(key, value);
	}

	return url.href.replace(origin, '');
};
