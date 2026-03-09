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
