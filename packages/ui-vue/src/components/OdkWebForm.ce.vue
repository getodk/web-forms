<script setup lang="ts">
import { createApp, getCurrentInstance } from 'vue';
import { webFormsPlugin } from '../WebFormsPlugin';
import OdkWebForm from './OdkWebForm.vue';

defineProps<{ formXml: string }>();
defineEmits(['submit']);

const app = createApp({});
app.use(webFormsPlugin);
const inst = getCurrentInstance();
Object.assign(inst!.appContext, app._context);
</script>

<template>
	<OdkWebForm ref="odkWebForm" :form-xml="formXml" @submit="$emit('submit')" />
</template>

<!-- 
	we have to re-import the stylesheets because Vue doesn't yet support 
	reading styles from child components and adding them in the shadow root
	Ref: https://github.com/vuejs/rfcs/discussions/596
-->
<style lang="scss">
  @import '../assets/css/icomoon.css';
  @import '../themes/2024-light/theme.scss';
  @import 'primeflex/primeflex.css';
</style>