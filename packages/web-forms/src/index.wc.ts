import { defineCustomElement } from 'vue';
import { OdkWebForm, webFormsPlugin } from '.';

const WebFormElement = defineCustomElement(OdkWebForm, {
  configureApp(app) {
    app.use(webFormsPlugin);
  },
  shadowRoot: false
});

customElements.define('odk-web-form', WebFormElement);
