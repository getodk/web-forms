import { createApp, defineCustomElement, getCurrentInstance, h } from 'vue';
import OdkWebForm from './components/OdkWebForm.vue';
import { webFormsPlugin } from './WebFormsPlugin';

interface WebComponent {
	styles: string[];
	emits: string[];
}

const OdkWebFormWC = OdkWebForm as unknown as WebComponent;

// OdkWebForm is not directly passed to defineCustomElement because we want
// to install the webFormsPlugin for PrimeVue to work in Web Component.
const OdkWebFormElement = defineCustomElement({
	styles: OdkWebFormWC.styles,
	emits: OdkWebFormWC.emits,
	setup(props, { emit }) {
		const app = createApp({});
		app.use(webFormsPlugin);
		const inst = getCurrentInstance();
		Object.assign(inst!.appContext, app._context);

		// Injecting the style in the host application's head for
		// 1 - Custom fonts to work with custom element
		//     Custom fonts are not yet support in shadow DOM
		//     Vue doesn't support to turn off shadow DOM see @vuejs#4404
		// 2 - PrimeVue adds adhoc elements to the DOM of the host application
		//     in certain cases like dropdowns
		if (!document.getElementById('odk-web-forms-styles')) {
			const head = document.head || document.getElementsByTagName('head')[0];
			const style = document.createElement('style');
			style.id = 'odk-web-forms-styles';
			style.innerText = OdkWebFormWC.styles.join('\n');
			head.appendChild(style);
		}

		// To enable emits
		// see https://stackoverflow.com/questions/74528406/unable-to-emit-events-when-wrapping-a-vue-3-component-into-a-custom-element
		const events = Object.fromEntries(
			OdkWebFormWC.emits.map((event: string) => {
				return [
					`on${event[0].toUpperCase()}${event.slice(1)}`,
					(payload: unknown) => emit(event, payload),
				];
			})
		);

		return () =>
			h(OdkWebFormWC, {
				...props,
				...events,
			});
	},
});

customElements.define('odk-web-form', OdkWebFormElement);
