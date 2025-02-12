/*
import { mount, VueWrapper } from '@vue/test-utils';
import { describe, expect } from 'vitest';
import InputControl from '@/components/controls/Input/InputControl.vue';
import FormQuestion from '@/components/controls/FormQuestion.vue';
import { getReactiveForm, globalMountOptions } from '../../../helpers';

describe('InputGeopoint', () => {
	const getInputControl = async () => {
		const xform = await getReactiveForm('1-geopoint.xml');

		const component = mount(FormQuestion, {
			props: {
				node: xform.currentState.children[0] as InputControl,
			},
			global: { ...globalMountOptions },
		});

		return component.findComponent(InputControl) as VueWrapper;
	};

	it('should render input control with geopoint', async () => {
		const inputControl = await getInputControl();
		expect(inputControl.exists()).toBe(true);

		const geopoint = inputControl.find('.geolocation-control');
		expect(geopoint.exists()).toBe(true);

		const getLocationBtn = geopoint.find('.get-location-button');
		expect(getLocationBtn.exists()).toBe(true);
		expect(getLocationBtn.text()).toEqual('hola');
	});
});
*/
