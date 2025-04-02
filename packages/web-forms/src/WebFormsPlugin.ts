import { type App } from 'vue';
import PrimeVue from 'primevue/config';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

const customPreset = definePreset(Aura, {
	semantic: {
		primary: {
			50: '#e9f8ff',
			textColor: '#1b1b1f',
		},
		text: {
			color: '#1b1b1f',
		},
		error: {
			textColor: '#b3261e',
			background: '#ffedea',
		},
		surface: {
			300: '#cbcacc',
		},
	},
});

export const webFormsPlugin = {
	install(app: App) {
		// TODO app.use(PrimeVue, { ripple: false }); // Collect has no ripple
		app.use(PrimeVue, { theme: { preset: customPreset } });
	},
};
