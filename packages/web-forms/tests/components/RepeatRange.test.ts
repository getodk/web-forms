import FormGroup from '@/components/FormGroup.vue';
import RepeatInstance from '@/components/RepeatInstance.vue';
import RepeatRange from '@/components/RepeatRange.vue';
import type { RepeatRangeNode } from '@getodk/xforms-engine';
import { mount } from '@vue/test-utils';
import { assert, describe, expect, it } from 'vitest';
import { getReactiveForm, globalMountOptions } from '../helpers';

const mountComponent = async (fileName: string) => {
	const xform = await getReactiveForm(fileName);
	const [node] = xform.currentState.children;

	assert(
		node.nodeType === 'repeat-range:controlled' || node.nodeType === 'repeat-range:uncontrolled'
	);

	node satisfies RepeatRangeNode;

	return mount(RepeatRange, {
		props: {
			node,
		},
		global: globalMountOptions,
	});
};

describe('RepeatRange', () => {
	it('adds a new instance', async () => {
		const component = await mountComponent('09-repeat-with-dynamic-label.xml');

		expect(component.findAllComponents(RepeatInstance).length).toBe(1);

		await component.find('.button-add-instance').trigger('click');

		expect(component.findAllComponents(RepeatInstance).length).toBe(2);
	});

	it('removes an instance', async () => {
		const component = await mountComponent('09-repeat-with-dynamic-label.xml');

		expect(component.findAllComponents(RepeatInstance).length).toBe(1);

		await component.find('.button-menu').trigger('click');

		await component.find('li[aria-label="Remove"] a').trigger('click');

		expect(component.findAllComponents(RepeatInstance).length).toBe(0);
	});

	it('coalesces group if it is the only child', async () => {
		const component = await mountComponent('09-repeat-with-dynamic-label.xml');

		const instance = component.findComponent(RepeatInstance);

		expect(instance.findComponent(FormGroup).exists()).toBe(false);
	});

	it('does not coalesces group if there are other children', async () => {
		const component = await mountComponent('10-repeat-with-multiple-children.xml');

		const instance = component.findComponent(RepeatInstance);

		expect(instance.findComponent(FormGroup).exists()).toBe(true);
	});
});
