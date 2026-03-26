import { createIntl, type PrimitiveType } from '@formatjs/intl';
import type { FormLanguage, RootNode } from '@getodk/xforms-engine';
import { all as primeLocales } from 'primelocale';
import { usePrimeVue } from 'primevue/config';
import type { Ref } from 'vue';
import { computed, onUnmounted, shallowRef, watch } from 'vue';
// English strings always available as language fallback
import enRaw from '@locales/strings_en.json';

export type Translate = (id: string, values?: Record<string, PrimitiveType>) => string;
type TransifexTranslation = Record<string, string | { string: string }>;
type ICUMessage = Record<string, string>;

const FALLBACK = 'en';
export const STORAGE_KEY = 'odk-web-forms-locale';

const availableTranslations = import.meta.glob<{ default: TransifexTranslation }>(
	'@locales/strings_*.json'
);

/**
 * Transifex exports messages wrapped in an object (e.g., `{ string: "..." }`).
 * This flattens them into a consistent key-value pair.
 */
export const normalizeMessages = (raw: TransifexTranslation): ICUMessage => {
	const result: ICUMessage = {};

	for (const key in raw) {
		const message = raw[key];
		const value = typeof message === 'string' ? message : message?.string;
		if (value) {
			result[key] = value;
		}
	}

	return result;
};

const enMessages = normalizeMessages(enRaw as TransifexTranslation);

const loadMessages = async (locale: string): Promise<ICUMessage> => {
	if (locale === FALLBACK) {
		return enMessages;
	}

	try {
		const raw = await availableTranslations[`/locales/strings_${locale}.json`]!();
		return { ...enMessages, ...normalizeMessages(raw.default) };
	} catch (error) {
		// eslint-disable-next-line no-console
		console.warn(`Failed to load messages for locale "${locale}", falling back to English:`, error);
		return enMessages;
	}
};

const baseLanguage = (code: string): string => code.split('-')[0] ?? code;

/**
 * Resolves what is available for a requested locale: exact match → base language → English.
 * Preference/priority (which locale to request in the first place) is handled upstream by resolveUILocale.
 */
const findAvailableLocale = (locale: string, isAvailable: (l: string) => boolean): string => {
	if (locale === FALLBACK) {
		return FALLBACK;
	}

	if (isAvailable(locale)) {
		return locale;
	}

	const base = baseLanguage(locale);
	if (base !== locale && isAvailable(base)) {
		return base;
	}

	return FALLBACK;
};

const findFormLanguage = (languages: FormLanguage[], localeCode: string | null | undefined) => {
	if (!localeCode?.length || !languages.length) {
		return;
	}

	const exactMatch = languages.find((lang) => lang.locale?.baseName === localeCode);
	if (exactMatch) {
		return exactMatch;
	}

	// Fall back to base language match (e.g. "en" matches "en-US")
	return languages.find((lang) => {
		return lang.locale?.baseName && baseLanguage(lang.locale.baseName) === baseLanguage(localeCode);
	});
};

const resolveUILocale = (formLanguage?: FormLanguage) => {
	return (
		formLanguage?.locale?.baseName ?? navigator.languages?.[0] ?? navigator.language ?? FALLBACK
	);
};

const findBrowserFormLanguage = (languages: FormLanguage[]) => {
	const browserLanguages = navigator.languages ?? [navigator.language];
	for (const lang of browserLanguages) {
		const found = findFormLanguage(languages, lang);
		if (found) {
			return found;
		}
	}
};

const findSavedFormLanguage = (languages: FormLanguage[]) => {
	try {
		return findFormLanguage(languages, localStorage.getItem(STORAGE_KEY));
	} catch {
		// localStorage access can fail in sandboxed iframes.
		return null;
	}
};

const isSupportedFormLanguage = (
	languages: FormLanguage[],
	formLanguage: FormLanguage | undefined
): formLanguage is FormLanguage => {
	if (!formLanguage?.language.length || !languages.length) {
		return false;
	}

	return languages.some((lang) => {
		return (
			lang.language === formLanguage.language &&
			lang.locale?.baseName === formLanguage.locale?.baseName
		);
	});
};

export const useLocale = (formRef: Ref<RootNode | null>) => {
	const primevue = usePrimeVue();
	const currentIntl = shallowRef(
		createIntl({ locale: FALLBACK, messages: enMessages, defaultLocale: FALLBACK })
	);
	const latestRequestedLocale = { locale: FALLBACK };
	// SyntheticDefaultLanguage is a placeholder used when a form has no defined languages, not a real selectable language.
	const formLanguages = computed(() => {
		return formRef.value?.languages.filter((lang) => !lang.isSyntheticDefault) ?? [];
	});

	const setLanguage = (formLanguage: FormLanguage | undefined) => {
		if (!isSupportedFormLanguage(formLanguages.value, formLanguage)) {
			return;
		}

		applyLocale(resolveUILocale(formLanguage));
		formRef.value?.setLanguage(formLanguage);
		if (formLanguage.locale?.baseName?.length) {
			try {
				localStorage.setItem(STORAGE_KEY, formLanguage.locale.baseName);
			} catch (error) {
				// eslint-disable-next-line no-console
				console.warn("Failed to save the user's locale preference to localStorage:", error);
			}
		}
	};

	const applyLocale = (newLocale: string) => {
		latestRequestedLocale.locale = newLocale;
		document.documentElement.lang = newLocale;

		const primeLocaleKey = findAvailableLocale(newLocale, (lang) => {
			return Object.hasOwn(primeLocales, lang);
		});
		const primeLocale = primeLocales[primeLocaleKey as keyof typeof primeLocales];
		if (primeLocale) {
			primevue.config.locale = { ...primevue.config.locale, ...primeLocale };
		}

		const messagesLocale = findAvailableLocale(newLocale, (lang) => {
			return Object.hasOwn(availableTranslations, `/locales/strings_${lang}.json`);
		});
		void loadMessages(messagesLocale).then((messages) => {
			if (latestRequestedLocale.locale === newLocale) {
				currentIntl.value = createIntl({
					locale: messagesLocale,
					messages,
					defaultLocale: FALLBACK,
				});
			}
		});
	};

	watch(
		formLanguages,
		(langs) => {
			if (!langs.length) {
				// No form languages found (loading error or empty form).
				// Skipping persisted locale: without form context the user can't change language,
				// the saved preference stays untouched for the next form load.
				applyLocale(resolveUILocale());
				return;
			}
			const formLanguage =
				findSavedFormLanguage(langs) ?? findBrowserFormLanguage(langs) ?? langs[0]!;
			setLanguage(formLanguage);
		},
		{ immediate: true }
	);

	onUnmounted(() => {
		latestRequestedLocale.locale = FALLBACK;
		document.documentElement.lang = FALLBACK;
	});

	const t: Translate = (id, values) => {
		return currentIntl.value.formatMessage({ id }, values) as string;
	};

	return { setLanguage, t };
};
