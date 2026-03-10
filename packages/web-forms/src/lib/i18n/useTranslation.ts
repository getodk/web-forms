import { I18N_CONTEXT } from '@/lib/constants/injection-keys.ts';
import { inject, provide, type ShallowRef, shallowRef } from 'vue';
import { IntlMessageFormat } from 'intl-messageformat';
import {
	createDefaultI18nState,
	type I18nState,
	type TranslationDictionary,
	type TranslationItem,
} from './i18n-context.ts';

const isTranslationItem = (val: unknown): val is TranslationItem => {
	return val !== null && typeof val === 'object' && 'string' in val;
};

const resolvePath = (
	obj: TranslationDictionary | TranslationItem | undefined,
	keys: string[]
): TranslationItem | undefined => {
	const [first, ...rest] = keys;
	if (!first) {
		return isTranslationItem(obj) ? obj : undefined;
	}

	const isTranslationDictionary = obj && !isTranslationItem(obj) && obj[first];
	return isTranslationDictionary ? resolvePath(obj[first], rest) : undefined;
};

export function useTranslation(
	namespace: string,
	defaults: TranslationDictionary,
	overrideState?: ShallowRef<I18nState>
) {
	if (overrideState) {
		provide(I18N_CONTEXT, overrideState);
	}

	const context = overrideState ?? inject(I18N_CONTEXT, shallowRef(createDefaultI18nState()));

	const t = (path: string, values?: Record<string, number | string>): string => {
		const { locale, translations, cache } = context.value;

		const keys = path.split('.');
		const target = resolvePath(translations[namespace], keys) ?? resolvePath(defaults, keys);
		const pattern = target?.string;
		if (!pattern) {
			return path;
		}

		if (!values) {
			return pattern;
		}

		const cacheKey = `${locale}|${pattern}`;
		try {
			if (!cache.has(cacheKey)) {
				cache.set(cacheKey, new IntlMessageFormat(pattern, locale));
			}
			return cache.get(cacheKey)!.format(values) as string;
		} catch {
			return pattern;
		}
	};

	return { t };
}
