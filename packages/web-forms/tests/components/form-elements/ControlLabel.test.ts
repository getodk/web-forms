import type { AnyInputNode } from '@getodk/xforms-engine';
import { mount } from '@vue/test-utils';
import { assocPath } from 'ramda';
import { describe, expect, it } from 'vitest';
import ControlLabel from '@/components/form-elements/ControlLabel.vue';

const baseQuestion = {
	nodeType: 'input',
	currentState: {
		required: true,
		label: {
			asString: 'First Name',
		},
	},
} as AnyInputNode;

describe('ControlLabel', () => {
	it('shows asterisk with field is required', () => {
		const component = mount(ControlLabel, {
			props: {
				question: baseQuestion,
			},
		});

		const requireSpan = component.find('span.required');

		expect(requireSpan.exists()).toBe(true);
		expect(requireSpan.text()).toBe('*');

		expect(component.text()).toBe('* First Name');
	});

	it('does not show asterisk when field is not required', () => {
		const component = mount(ControlLabel, {
			props: {
				question: assocPath(['currentState', 'required'], false, baseQuestion),
			},
		});

		const requireSpan = component.find('span.required');

		expect(requireSpan.exists()).toBe(false);

		expect(component.text()).toBe('First Name');
	});
});
