import { shallowRef } from 'vue';
import {
	createDefaultI18nState,
	FALLBACK_LOCALE,
	getFallbackLocaleData,
	type TranslationDictionary,
} from './i18n-context.ts';

export type FetchTranslationsCallback = (
	localeCode: string
) => Promise<Record<string, TranslationDictionary>>;

export function useI18nSetup(fetchTranslations?: FetchTranslationsCallback) {
	const browserLocale = navigator.language?.split('-')[0];
	const i18nState = shallowRef(createDefaultI18nState(browserLocale));

	const setLocale = async (newLocale: string | undefined) => {
		if (!fetchTranslations || !newLocale || newLocale === FALLBACK_LOCALE) {
			i18nState.value = { ...i18nState.value, ...getFallbackLocaleData() };
			return;
		}

		try {
			const translations = await fetchTranslations(newLocale);
			i18nState.value = { ...i18nState.value, locale: newLocale, translations };
		} catch (error) {
			// eslint-disable-next-line no-console
			console.warn(
				`Failed to fetch translations for ${newLocale}. Fallback to ${FALLBACK_LOCALE}.`,
				error
			);
			i18nState.value = { ...i18nState.value, ...getFallbackLocaleData() };
		}
	};

	void setLocale(browserLocale);
	return { i18nState, setLocale };
}
