import { FORM_MEDIA_CACHE, FORM_OPTIONS } from '@/lib/constants/injection-keys.ts';
import type { FormOptions } from '@/lib/init/load-form-state.ts';
import type {
	JRResourceURL,
	JRResourceURLString,
} from '@getodk/common/jr-resources/JRResourceURL.ts';
import { createObjectURL, type ObjectURL } from '@getodk/common/lib/web-compat/url.ts';
import { inject } from 'vue';

export function useMediaLoader(
	onSuccess: (value: string) => void,
	onError: (error: Error) => void
) {
	const formOptions = inject<FormOptions>(FORM_OPTIONS);
	const mediaCache = inject<Map<JRResourceURLString, ObjectURL>>(FORM_MEDIA_CACHE, new Map());

	const loadMedia = async (src?: JRResourceURL): Promise<void> => {
		if (src?.href == null || formOptions?.fetchFormAttachment == null) {
			// TODO: translations
			onError(new Error('Cannot fetch media. Verify the URL and fetch settings.'));
			return;
		}

		try {
			const cache = mediaCache.get(src.href);
			if (cache != null) {
				onSuccess(cache);
				return;
			}

			const response = await formOptions.fetchFormAttachment(src);
			if (!response.ok || response.status !== 200) {
				// TODO: translations
				onError(new Error(`Media not found. File: ${src.href}`));
				return;
			}

			const data = await response.blob();
			const url = createObjectURL(data);
			mediaCache.set(src.href, url);
			onSuccess(url);
		} catch {
			// TODO: translations
			onError(new Error(`Cannot fetch media. Unknown error. File: ${src.href}`));
		}
	};

	return { loadMedia };
}
