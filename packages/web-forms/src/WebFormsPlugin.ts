import { odkThemePreset } from '@/odkThemePreset.ts';
import { type App } from 'vue';
import PrimeVue from 'primevue/config';
import resetStyles from './assets/css/reset.scss?raw';

export const webFormsPlugin = {
	install(app: App) {
		const styleElement = document.createElement('style');
		styleElement.textContent = resetStyles;
		document.head.prepend(styleElement);

		app.use(PrimeVue, { theme: { preset: odkThemePreset, options: { darkModeSelector: false } } });
	},
};
