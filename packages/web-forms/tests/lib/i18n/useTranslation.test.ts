import { describe, it, expect } from 'vitest';
import { defineComponent, shallowRef } from 'vue';
import { mount } from '@vue/test-utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { I18N_CONTEXT } from '@/lib/constants/injection-keys';
import type { TranslationDictionary, I18nState } from '@/lib/i18n/i18n.types';

describe('useTranslation', () => {
	const NAMESPACE = 'myNamespace';

	const mockDefaultTranslation: TranslationDictionary = {
		actions: {
			save: { string: 'Save', developer_comment: 'Save form' },
		},
		greetings: {
			hi: { string: 'Hello, {name}!', developer_comment: 'Greeting' },
		},
	};

	const TestComponent = defineComponent({
		setup() {
			return useTranslation(NAMESPACE, mockDefaultTranslation);
		},
		template: '<div />',
	});

	const mountWithContext = (state: Partial<I18nState> = {}) => {
		const defaultState: I18nState = {
			locale: 'en',
			translations: {},
			cache: new Map(),
			...state,
		};

		return mount(TestComponent, {
			global: {
				provide: { [I18N_CONTEXT]: shallowRef(defaultState) },
			},
		});
	};

	describe('Path Resolution', () => {
		it('resolves a simple string from defaults', () => {
			const wrapper = mountWithContext();
			expect(wrapper.vm.t('actions.save')).toBe('Save');
		});

		it('prioritizes host translations over defaults', () => {
			const wrapper = mountWithContext({
				translations: {
					[NAMESPACE]: {
						actions: {
							save: { string: 'Submit', developer_comment: 'Overridden' },
						},
					},
				},
			});

			expect(wrapper.vm.t('actions.save')).toBe('Submit');
		});

		it('returns the raw path if key is missing everywhere', () => {
			const wrapper = mountWithContext();
			expect(wrapper.vm.t('missing.key')).toBe('missing.key');
		});

		it('returns the raw path when pointing to a dictionary (branch) instead of an item (leaf)', () => {
			const wrapper = mountWithContext();
			// 'actions' exists but is a branch, not a translation item
			expect(wrapper.vm.t('actions')).toBe('actions');
		});

		it('handles "over-traveling" a path safely', () => {
			const wrapper = mountWithContext();
			expect(wrapper.vm.t('actions.save.extra')).toBe('actions.save.extra');
		});
	});

	describe('ICU Formatting', () => {
		it('formats ICU messages with provided variables', () => {
			const wrapper = mountWithContext();
			expect(wrapper.vm.t('greetings.hi', { name: 'ODK' })).toBe('Hello, ODK!');
		});

		it('falls back to the raw pattern if formatting fails (missing values)', () => {
			const wrapper = mountWithContext();
			expect(wrapper.vm.t('greetings.hi')).toBe('Hello, {name}!');
		});
	});
});
