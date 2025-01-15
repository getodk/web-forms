import SelectControl from '@/components/controls/SelectControl.vue';
import type { AnyNode, AnySelectNode, RootNode } from '@getodk/xforms-engine';
import { DOMWrapper, mount } from '@vue/test-utils';
import { assert, beforeEach, describe, expect, it } from 'vitest';
import { getReactiveForm, globalMountOptions } from '../helpers.ts';

const findSelectNodeByReference = (node: AnyNode, reference: string): AnySelectNode | null => {
	const nodeReference = node.currentState.reference;

	if (nodeReference === reference) {
		assert(node.nodeType === 'select');

		return node;
	}

	const children = node.currentState.children ?? [];

	for (const child of children) {
		const result = findSelectNodeByReference(child, reference);

		if (result != null) {
			return result;
		}
	}

	return null;
};

const getSelectNodeByReference = (root: RootNode, reference: string): AnySelectNode => {
	const result = findSelectNodeByReference(root, reference);

	assert(result != null);

	return result;
};

interface MountComponentOptions {
	readonly submitPressed?: boolean;
}

type MountedComponent = ReturnType<typeof mountComponent>;

const mountComponent = (selectNode: AnySelectNode, options?: MountComponentOptions) => {
	const { submitPressed = false } = options ?? {};

	return mount(SelectControl, {
		props: {
			question: selectNode,
		},
		global: {
			...globalMountOptions,
			provide: { submitPressed },
		},
		attachTo: document.body,
	});
};

const expectSelectedValuesState = (
	selectNode: AnySelectNode,
	expectedValues: readonly string[]
) => {
	const actualValues = selectNode.currentState.value;

	expect(actualValues.length).toBe(expectedValues.length);

	for (const expectedValue of expectedValues) {
		expect(actualValues).toContain(expectedValue);
	}
};

const expectSelectedValueState = (selectNode: AnySelectNode, value: string | null) => {
	if (value == null) {
		return expectSelectedValuesState(selectNode, []);
	}

	return expectSelectedValuesState(selectNode, [value]);
};

const findMenu = (component: MountedComponent): DOMWrapper<HTMLElement> | null => {
	const [menu = null] = component.findAll<HTMLElement>('.p-dropdown-items, .p-multiselect-items');

	return menu;
};

const openMenu = async (
	component: MountedComponent,
	controlElement: DOMWrapper<HTMLElement>
): Promise<DOMWrapper<HTMLElement>> => {
	let menu = findMenu(component);

	if (menu == null) {
		await controlElement.trigger('click');

		menu = findMenu(component);
	}

	assert(menu != null);

	return menu;
};

const getMenuItems = async (
	component: MountedComponent,
	controlElement: DOMWrapper<HTMLElement>
): Promise<ReadonlyArray<DOMWrapper<HTMLElement>>> => {
	const menu = await openMenu(component, controlElement);

	return menu.findAll('.p-dropdown-item, .p-multiselect-item');
};

const getMenuItem = async (
	component: MountedComponent,
	controlElement: DOMWrapper<HTMLElement>,
	label: string
): Promise<DOMWrapper<HTMLElement> | null> => {
	const menuItems = await getMenuItems(component, controlElement);

	return menuItems.find((menuItem) => menuItem.text() === label) ?? null;
};

describe('SelectControl', () => {
	describe('select1', () => {
		describe('no appearance (radio controls)', () => {
			let root: RootNode;
			let selectNode: AnySelectNode;
			let component: MountedComponent;
			let cherry: DOMWrapper<HTMLInputElement>;
			let mango: DOMWrapper<HTMLInputElement>;

			beforeEach(async () => {
				root = await getReactiveForm('select-control.xml');
				selectNode = getSelectNodeByReference(root, '/data/no-appearance/sel1');
				component = mountComponent(selectNode);

				const nodeId = selectNode.nodeId;

				cherry = component.find(`input[id="${nodeId}_cherry"]`);
				mango = component.find(`input[id="${nodeId}_mango"]`);

				expectSelectedValueState(selectNode, 'cherry');
			});

			it('renders radio buttons for items of <select1> with no appearance', () => {
				expect(cherry.element.type).toEqual('radio');
				expect(mango.element.type).toEqual('radio');
			});

			it('renders the selected value as checked', () => {
				expect(cherry.element.checked).toBe(true);
				expect(mango.element.checked).toBe(false);
			});

			it('updates the selection when selecting a rendered radio', async () => {
				await mango.trigger('click');

				expectSelectedValueState(selectNode, 'mango');
				expect(cherry.element.checked).toBe(false);
				expect(mango.element.checked).toBe(true);
			});
		});

		interface Select1MenuAppearanceCase {
			readonly appearance: string;
			readonly reference: string;
		}

		describe.each<Select1MenuAppearanceCase>([
			{ appearance: 'minimal', reference: '/data/minimal' },
			{ appearance: 'search', reference: '/data/search' },
			{ appearance: 'minimal search', reference: '/data/minimal_search' },
		])('dropdown with appearance: $appearance', ({ reference }) => {
			let root: RootNode;
			let selectNode: AnySelectNode;
			let component: MountedComponent;
			let controlElement: DOMWrapper<HTMLDivElement>;

			beforeEach(async () => {
				root = await getReactiveForm('select-control.xml');
				selectNode = getSelectNodeByReference(root, reference);
				component = mountComponent(selectNode);
				controlElement = component.find(`[id="${selectNode.nodeId}"]`);
			});

			it('renders as a dropdown', () => {
				// TODO: this is tied to PrimeVue's classes, we should control this!
				expect(controlElement.classes()).toContain('p-dropdown');
			});

			const expectedOptionLabels = ['Karachi', 'Toronto', 'Lahore', 'Islamabad', 'Vancouver'];

			it('shows option items in a menu', async () => {
				const menuItems = await getMenuItems(component, controlElement);

				expect(menuItems.length).toBe(expectedOptionLabels.length);

				for (const [index, expectedLabel] of expectedOptionLabels.entries()) {
					const menuItem = menuItems[index];

					assert(menuItem != null);

					expect(menuItem.text()).toBe(expectedLabel);
				}
			});

			it.each(expectedOptionLabels)('selects option: %s', async (expectedOptionLabel) => {
				let menuItem = await getMenuItem(component, controlElement, expectedOptionLabel);

				assert(menuItem != null);
				expectSelectedValueState(selectNode, null);
				expect(menuItem.classes()).not.toContain('p-highlight');

				await menuItem.trigger('click');

				menuItem = await getMenuItem(component, controlElement, expectedOptionLabel);
				assert(menuItem != null);

				expectSelectedValueState(selectNode, expectedOptionLabel.toLowerCase());
				expect(menuItem.classes()).toContain('p-highlight');
			});
		});
	});

	describe('select', () => {
		describe('no appearance (checkbox controls)', () => {
			let root: RootNode;
			let selectNode: AnySelectNode;
			let component: MountedComponent;
			let watermelon: DOMWrapper<HTMLInputElement>;
			let peach: DOMWrapper<HTMLInputElement>;

			beforeEach(async () => {
				root = await getReactiveForm('select-control.xml');
				selectNode = getSelectNodeByReference(root, '/data/no-appearance/sel');
				component = mountComponent(selectNode);

				const nodeId = selectNode.nodeId;

				watermelon = component.find(`input[id="${nodeId}_watermelon"]`);
				peach = component.find(`input[id="${nodeId}_peach"]`);

				expectSelectedValuesState(selectNode, ['peach']);
			});

			it('renders checkboxes for items of <select> with no appearance', () => {
				expect(watermelon.element.type).toEqual('checkbox');
				expect(peach.element.type).toEqual('checkbox');
			});

			it('renders the selected value as checked', () => {
				expect(watermelon.element.checked).toBe(false);
				expect(peach.element.checked).toBe(true);
			});

			it('updates the selection when selecting a rendered checkbox', async () => {
				await watermelon.trigger('click');

				expectSelectedValuesState(selectNode, ['peach', 'watermelon']);
				expect(watermelon.element.checked).toBe(true);
				expect(peach.element.checked).toBe(true);

				await peach.trigger('click');

				expectSelectedValuesState(selectNode, ['watermelon']);
				expect(watermelon.element.checked).toBe(true);
				expect(peach.element.checked).toBe(false);
			});
		});

		interface SelectMultiMenuAppearanceCase {
			readonly appearance: string;
			readonly reference: string;
		}

		describe.each<SelectMultiMenuAppearanceCase>([
			{ appearance: 'minimal', reference: '/data/minimal_m' },
			{ appearance: 'search', reference: '/data/search_m' },
			{ appearance: 'minimal search', reference: '/data/minimal_search_m' },
		])('dropdown with appearance: $appearance', ({ reference }) => {
			let root: RootNode;
			let selectNode: AnySelectNode;
			let component: MountedComponent;
			let controlElement: DOMWrapper<HTMLDivElement>;

			beforeEach(async () => {
				root = await getReactiveForm('select-control.xml');
				selectNode = getSelectNodeByReference(root, reference);
				component = mountComponent(selectNode);
				controlElement = component.find(`[id="${selectNode.nodeId}-control"]`);
			});

			it('renders as a dropdown', () => {
				// TODO: this is tied to PrimeVue's classes, we should control this!
				expect(controlElement.classes()).toContain('p-multiselect');
			});

			const expectedOptionLabels = ['Karachi', 'Toronto', 'Lahore', 'Islamabad', 'Vancouver'];

			it('shows option items in a menu', async () => {
				const menuItems = await getMenuItems(component, controlElement);

				expect(menuItems.length).toBe(expectedOptionLabels.length);

				for (const [index, expectedLabel] of expectedOptionLabels.entries()) {
					const menuItem = menuItems[index];

					assert(menuItem != null);

					expect(menuItem.text()).toBe(expectedLabel);
				}
			});

			it.each(expectedOptionLabels)('selects option: %s', async (expectedOptionLabel) => {
				let menuItem = await getMenuItem(component, controlElement, expectedOptionLabel);

				assert(menuItem != null);

				let menuItemSelection = menuItem.find('.p-checkbox');

				expectSelectedValueState(selectNode, null);

				expect(menuItemSelection.classes()).not.toContain('p-highlight');

				await menuItem.trigger('click');

				expectSelectedValueState(selectNode, expectedOptionLabel.toLowerCase());

				menuItem = await getMenuItem(component, controlElement, expectedOptionLabel);

				assert(menuItem != null);

				menuItemSelection = menuItem.find('.p-checkbox');

				expect(menuItemSelection.classes()).toContain('p-highlight');
			});
		});
	});

	describe('validation', () => {
		it('does not show validation message on init', async () => {
			const root = await getReactiveForm('select-control.xml');
			const selectNode = getSelectNodeByReference(root, '/data/no-appearance/sel1');
			const component = mountComponent(selectNode);

			expect(component.get('.validation-message').isVisible()).toBe(false);
		});

		it('shows validation message for invalid state', async () => {
			const root = await getReactiveForm('1-validation.xml');
			const selectNode = getSelectNodeByReference(root, '/data/citizen');
			const component = mountComponent(selectNode);
			const pakistan = component.find('input[id*=_pk]');

			await pakistan.setValue();

			expect(component.get('.validation-message').isVisible()).toBe(true);
			expect(component.get('.validation-message').text()).toBe('It has to be two');
		});

		it('hides validation message when user enters a valid value', async () => {
			const root = await getReactiveForm('1-validation.xml');
			const selectNode = getSelectNodeByReference(root, '/data/citizen');
			const component = mountComponent(selectNode);
			const pakistan = component.find('input[id*=_pk]');

			await pakistan.setValue();
			const canada = component.find('input[id*=_ca]');
			await canada.setValue();
			expect(component.get('.validation-message').text()).toBe('');
		});

		it('shows validation message on submit pressed even when no interaction is made with the component', async () => {
			const root = await getReactiveForm('1-validation.xml');
			const selectNode = getSelectNodeByReference(root, '/data/citizen');
			const component = mountComponent(selectNode, { submitPressed: true });

			expect(component.get('.validation-message').isVisible()).toBe(true);
			expect(component.get('.validation-message').text()).toBe('Condition not satisfied: required');
		});
	});
});
