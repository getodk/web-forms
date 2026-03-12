import type { FormLanguage, FormLanguages, RootNode } from '@getodk/xforms-engine';
import type { PrimeVueConfiguration } from 'primevue';
import { watch, shallowRef } from 'vue';
import { all as primeLocales } from 'primelocale';

const FALLBACK = 'en';
const STORAGE_KEY = 'web_forms_locale';

const active = shallowRef<FormLanguage | undefined>();
const supported = shallowRef<FormLanguages | undefined>(undefined);
const form = shallowRef<RootNode | undefined>(undefined);

watch(
	active,
	(newVal) => {
		if (!newVal) {
			return;
		}

		form.value?.setLanguage(newVal);
		const locale = getLocale();
		document.documentElement.lang = locale;
		try {
			localStorage.setItem(STORAGE_KEY, locale);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.warn('Failed to save locale preference to localStorage:', error);
		}
	},
	{ immediate: true }
);

const getLocale = () => active.value?.locale?.baseName ?? FALLBACK;

const setLanguage = (formLanguage: FormLanguage | undefined, primevue: PrimeVueConfiguration) => {
	if (!isSupportedFormLanguage(formLanguage)) {
		return;
	}
	active.value = formLanguage;
	const primeLocale = primeLocales[getLocale()] ?? primeLocales[FALLBACK];
	if (primeLocale) {
		Object.assign(primevue.locale, primeLocale);
	}
};

const isSupportedFormLanguage = (formLanguage: FormLanguage | undefined) => {
	return !!supported.value?.find((lang) => {
		return (
			formLanguage?.language.length &&
			lang.language === formLanguage?.language &&
			lang.locale?.baseName === formLanguage?.locale?.baseName
		);
	});
};

const findSupportedLocale = (localeCode: string | null | undefined) => {
	if (!localeCode?.length) {
		return;
	}

	const exactMatch = supported.value?.find((lang) => lang.locale?.baseName === localeCode);
	if (exactMatch) {
		return exactMatch;
	}

	const baseCode = localeCode.split('-')[0];
	return supported.value?.find((lang) => lang.locale?.baseName?.split('-')[0] === baseCode);
};

const preferredBrowserLang = () => {
	for (const lang of navigator.languages || [navigator.language]) {
		const supportedLang = findSupportedLocale(lang);
		if (supportedLang) {
			return supportedLang;
		}
	}
};

const init = (newform: RootNode, primevue: PrimeVueConfiguration) => {
	form.value = newform;
	supported.value = form.value.languages;

	const saved = localStorage.getItem(STORAGE_KEY);

	//eslint-disable-next-line
	const targetLang =
		findSupportedLocale(saved) ??
		preferredBrowserLang() ??
		supported.value?.[0]; // Default is the first supported language (<translation default="true()" ...>)

	setLanguage(targetLang, primevue);
};

export const localeService = {
	init,
	setLanguage,
};
