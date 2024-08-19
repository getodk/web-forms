import { definePreset, palette } from '@primevue/themes';
import Aura from '@primevue/themes/aura';
import PrimeVue from 'primevue/config';
import { type App } from 'vue';

const odkBlue = '#3e9fcc';

const odkPrimaryPalette = palette(odkBlue);

const OdkPreset:unknown = definePreset(Aura, {
	semantic: {
			primary: odkPrimaryPalette
	}
});

export const webFormsPlugin = {
	install(app: App) {
		app.use(PrimeVue, {
			ripple: false,
			theme: {
				preset: OdkPreset,
				options: {
					darkModeSelector: '.dark-mode',
					prefix: ''
				}
			}
		}); 
	},
};

