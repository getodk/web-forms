<script setup lang="ts">
import type { AnyLeafNode, SelectNode, StringNode } from '@getodk/xforms-engine';
import InputText from './controls/InputText.vue';
import SelectControl from './controls/SelectControl.vue';
import UnsupportedControl from './controls/UnsupportedControl.vue';

defineProps<{question: AnyLeafNode}>();

const isStringNode = (n: AnyLeafNode) : n is StringNode => n.nodeType === 'string';
const isSelectNode = (n: AnyLeafNode) : n is SelectNode => n.nodeType === 'select';


</script>

<template>
	<div :id="question.nodeId + '_container'" class="flex flex-column p-3" :class="{ invalid: question.validationState.violation?.valid === false}">
		<InputText v-if="isStringNode(question)" :question="question" />

		<SelectControl v-else-if="isSelectNode(question)" :question="question" />

		<UnsupportedControl v-else :question="question" />

		<div class="validation-message">
			{{ question.validationState.violation?.message.asString }}
		</div>
	</div>
</template>

<style scoped lang="scss">
.validation-message{
	display: none;
	color: var(--error-text-color);
}

.invalid:has(.dirty) {	
	.validation-message {
		display: block;
	}
}

:global(.odk-form.submit-pressed .invalid){
	background-color: var(--error-bg-color);
}

:global(.odk-form.submit-pressed .invalid .validation-message){
	display: block;
}
</style>