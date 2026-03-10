import type { IntlMessageFormat } from 'intl-messageformat';

export interface TranslationItem {
	readonly string: string;
	readonly developer_comment: string;
}

export interface TranslationDictionary {
	[key: string]: TranslationDictionary | TranslationItem;
}

export interface I18nState {
	locale: string;
	translations: Record<string, TranslationDictionary | TranslationItem>;
	cache: Map<string, IntlMessageFormat>;
}

export const FALLBACK_LOCALE = 'en';

export const getFallbackLocaleData = () => ({
	locale: FALLBACK_LOCALE,
	translations: {} as Record<string, TranslationDictionary>,
});

export const createDefaultI18nState = (initialLocale = FALLBACK_LOCALE): I18nState => ({
	...getFallbackLocaleData(),
	locale: initialLocale,
	cache: new Map<string, IntlMessageFormat>(),
});
