import FormQuestion from '@/components/form-layout/FormQuestion.vue';
import { SUBMIT_PRESSED } from '@/lib/constants/injection-keys.ts';
import { mount } from '@vue/test-utils';
import { assert, describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { getReactiveForm, globalMountOptions } from '../../../helpers';

const mountComponent = async (questionNumber: number, submitPressed = false) => {
	const xform = await getReactiveForm('1-validation.xml');
	const question = xform.currentState.children[questionNumber];

	assert(question.nodeType === 'input');

	return mount(FormQuestion, {
		props: { question },
		global: { ...globalMountOptions, provide: { [SUBMIT_PRESSED]: ref(submitPressed) } },
		attachTo: document.body,
	});
};

describe('InputControl', () => {
	describe('validation', () => {
		it('does not show validation message on init', async () => {
			const component = await mountComponent(0);
			expect(component.get('.validation-message').isVisible()).toBe(false);
		});

		it('shows validation message for invalid state and user has done editing', async () => {
			const component = await mountComponent(0);
			const input = component.find('input');
			await input.setValue('lorem ipsum');
			await input.setValue('');
			expect(component.get('.validation-message').isVisible()).toBe(true);
			expect(component.get('.validation-message').text()).toBe('Condition not satisfied: required');
		});

		it('hides validation message when user enters a valid value', async () => {
			const component = await mountComponent(0);
			const input = component.find('input');
			await input.setValue('lorem ipsum');
			expect(component.get('.validation-message').text()).toBe('');
		});

		it('shows a validation message even without user interaction with the component', async () => {
			const component = await mountComponent(0, true);
			expect(component.get('.validation-message').isVisible()).toBe(true);
			expect(component.get('.validation-message').text()).toBe('Condition not satisfied: required');
		});
	});
});
