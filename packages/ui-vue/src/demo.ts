import type { Component } from 'vue';
import { createApp } from 'vue';

import OdkWebFormDemo from './OdkWebFormDemo.vue';
import { webFormsPlugin } from './WebFormsPlugin';

import './assets/css/style.scss';

const app = createApp(OdkWebFormDemo as Component);
app.use(webFormsPlugin);
app.mount('#app');
