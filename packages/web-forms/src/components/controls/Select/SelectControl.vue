<script setup lang="ts">
import type { FormSetupOptions } from '@/lib/init/loadFormState.ts';
import type { SelectNode } from '@getodk/xforms-engine';
import Select1Control from './Select1Control.vue';
import SelectNControl from './SelectNControl.vue';

interface SelectControlProps {
	readonly question: SelectNode;
	readonly formSetupOptions: FormSetupOptions;
}

defineProps<SelectControlProps>();
</script>

<template>
	<Select1Control v-if="question.selectType === 'select1'" :form-setup-options="formSetupOptions" :question="question" />

	<SelectNControl v-else-if="question.selectType === 'select'" :form-setup-options="formSetupOptions" :question="question" />
</template>
