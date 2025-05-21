import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import { type ObjectURL, revokeObjectURL } from '@getodk/common/lib/web-compat/url.ts';

type ImageURL = string;

const image = new Map<ImageURL, ObjectURL>();

export const getCachedImage = (url: JRResourceURL): ObjectURL | null => {
	return image.get(url.href) ?? null;
};

export const cacheImage = (url: JRResourceURL, blob: ObjectURL): void => {
	image.set(url.href, blob);
};

export const clearImageCache = (): void => {
	image.forEach((value) => revokeObjectURL(value));
	image.clear();
};
