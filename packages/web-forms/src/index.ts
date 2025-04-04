import { webFormsPlugin } from './WebFormsPlugin';
import OdkWebForm from './components/OdkWebForm.vue';
import { POST_SUBMIT__NEW_INSTANCE } from './lib/constants/control-flow.ts';

/**
 * @todo there are almost certainly types we should be exporting from the
 * package entrypoint!
 */
export { OdkWebForm, POST_SUBMIT__NEW_INSTANCE, webFormsPlugin };
