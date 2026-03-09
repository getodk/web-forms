import { I18N_CONTEXT } from '@/lib/constants/injection-keys.ts';
import { inject, shallowRef } from 'vue';
import { IntlMessageFormat } from 'intl-messageformat';
import type { I18nState, TranslationDictionary, TranslationItem } from './i18n.types';

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

export function useTranslation(namespace: string, defaults: TranslationDictionary) {
	const context = inject(
		I18N_CONTEXT,
		shallowRef<I18nState>({
			locale: 'en',
			translations: {} as Record<string, TranslationDictionary>,
			cache: new Map<string, IntlMessageFormat>(),
		})
	);

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
