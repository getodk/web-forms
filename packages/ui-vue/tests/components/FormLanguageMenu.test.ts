import FormLanguageMenu from '@/components/FormLanguageMenu.vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { getReactiveForm, globalMountOptions } from '../helpers';

const mountComponent = async (formPath: string) => {
	const xform = await getReactiveForm(formPath);

	const component = mount(FormLanguageMenu, {
		props: {
			form: xform,
		},
		global: globalMountOptions,
	});

	return { xform, component };
};

// Workaround of the error thrown when language dropdown is opened
// This is an open issue of jsdom
// see primefaces/primevue#4512 and jsdom/jsdom#2177
/* eslint-disable */
const originalConsoleError = console.error;
const jsDomCssError = 'Error: Could not parse CSS stylesheet';
console.error = (...params) => {
	if (!params.find((p) => p.toString().includes(jsDomCssError))) {
		originalConsoleError(...params);
	}
};
/* eslint-enable */

describe('LanguageChanger', () => {
	it('does not show the dropdown when there is no user defined lang in the form', async () => {
		const { xform, component } = await mountComponent(
			'computations-demo/1-calculate-simple.xform.xml'
		);

		expect(xform.currentState.activeLanguage.isSyntheticDefault).to.be.true;

		expect(component.text()).to.be.empty;
	});

	it('changes the language', async () => {
		const { xform, component } = await mountComponent('itext/01-itext-basic.xml');

		expect(component.find('.p-dropdown-label').text()).to.be.eql('English');
		expect(xform.currentState.activeLanguage.language).to.be.eql('English');

		await component.trigger('click');

		await component.find('li[aria-posinset="2"]').trigger('click');

		expect(component.find('.p-dropdown-label').text()).to.be.eql('Español');
		expect(xform.currentState.activeLanguage.language).to.be.eql('Español');
	});
});
