import { localeService } from '@/lib/services/localeService.ts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import type { RootNode, FormLanguage } from '@getodk/xforms-engine';
import type { PrimeVueConfiguration } from 'primevue';

const createMockForm = (locales: string[]): RootNode => {
	return {
		languages: locales.map((loc) => ({
			language: `Language name for ${loc}`,
			locale: { baseName: loc },
		})),
		setLanguage: vi.fn(),
	} as unknown as RootNode;
};

const createMockPrimeVue = (): PrimeVueConfiguration => {
	return {
		locale: {},
	} as unknown as PrimeVueConfiguration;
};

describe('localeService', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
		document.documentElement.lang = '';

		vi.stubGlobal('navigator', {
			languages: ['en-US', 'en'],
			language: 'en-US',
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('initializes with the form default (first item) if nothing is saved or matched', async () => {
		const mockForm = createMockForm(['fr', 'de']);
		const mockPrimeVue = createMockPrimeVue();

		localeService.init(mockForm, mockPrimeVue);
		await nextTick();

		expect(document.documentElement.lang).toBe('fr');
		expect(localStorage.getItem('web_forms_locale')).toBe('fr');
		expect(mockForm.setLanguage).toHaveBeenCalledWith(mockForm.languages[0]);
	});

	it('initializes from localStorage if a valid locale is saved', async () => {
		localStorage.setItem('web_forms_locale', 'es');

		const mockForm = createMockForm(['en', 'es']);
		const mockPrimeVue = createMockPrimeVue();

		localeService.init(mockForm, mockPrimeVue);
		await nextTick();

		expect(document.documentElement.lang).toBe('es');
		expect(mockForm.setLanguage).toHaveBeenCalledWith(mockForm.languages[1]);
	});

	it('initializes from browser settings if localStorage is empty and browser lang is supported', async () => {
		vi.stubGlobal('navigator', { languages: ['fr-FR'] });

		const mockForm = createMockForm(['en', 'fr']);
		const mockPrimeVue = createMockPrimeVue();

		localeService.init(mockForm, mockPrimeVue);
		await nextTick();

		expect(document.documentElement.lang).toBe('fr');
		expect(mockForm.setLanguage).toHaveBeenCalledWith(mockForm.languages[1]);
	});

	it('updates state, DOM, and localStorage when setLanguage() is called', async () => {
		const mockForm = createMockForm(['en', 'de']);
		const mockPrimeVue = createMockPrimeVue();

		localeService.init(mockForm, mockPrimeVue);
		await nextTick();

		expect(document.documentElement.lang).toBe('en');

		const targetLang = mockForm.languages[1];
		localeService.setLanguage(targetLang, mockPrimeVue);
		await nextTick();

		expect(document.documentElement.lang).toBe('de');
		expect(localStorage.getItem('web_forms_locale')).toBe('de');
		expect(mockForm.setLanguage).toHaveBeenCalledWith(targetLang);
	});

	it('ignores unsupported locales in setLanguage()', async () => {
		const mockForm = createMockForm(['en']);
		const mockPrimeVue = createMockPrimeVue();

		localeService.init(mockForm, mockPrimeVue);
		await nextTick();
		expect(document.documentElement.lang).toBe('en');

		const unsupportedLang: FormLanguage = {
			language: 'Italian',
			locale: { baseName: 'it' }
		};
		localeService.setLanguage(unsupportedLang, mockPrimeVue);
		await nextTick();

		expect(document.documentElement.lang).toBe('en');
		expect(localStorage.getItem('web_forms_locale')).toBe('en');
	});
});
