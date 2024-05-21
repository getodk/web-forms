import { defineCustomElement } from 'vue';
import OdkWebFormCE from './components/OdkWebForm.ce.vue';

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
const WebFormBaseElement = defineCustomElement(OdkWebFormCE);

class WebFormElement extends WebFormBaseElement {
	connectedCallback() {
		super.connectedCallback();

		// Injecting the style in the host application's head for
		// 1 - Custom fonts to work with custom element
		//     Custom fonts are not yet support in shadow DOM
		//     Vue doesn't support to turn off shadow DOM see @vuejs#4404
		// 2 - PrimeVue adds adhoc elements to the DOM of the host application
		//     in certain cases like dropdowns
		const shadow = this.shadowRoot!;
		const childNodes = Array.from(shadow.childNodes);
		if (!document.getElementById('odk-web-forms-styles')) {
			const head = document.head || document.getElementsByTagName('head')[0];
			const style = document.createElement('style');
			style.id = 'odk-web-forms-styles';
			style.innerText = childNodes.find((n) => n.nodeName === 'STYLE')!.textContent!;
			head.appendChild(style);
		}
	}
}

customElements.define('odk-web-form', WebFormElement);
