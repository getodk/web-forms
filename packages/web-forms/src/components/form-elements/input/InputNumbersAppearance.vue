<script setup lang="ts">
import InputText from 'primevue/inputtext';
import type { StringInputNode } from '@getodk/xforms-engine';
import { computed, inject, ref } from 'vue';

interface InputNumbersAppearanceProps {
	readonly node: StringInputNode;
}

const props = defineProps<InputNumbersAppearanceProps>();

const doneAnswering = inject<boolean>('doneAnswering');
const submitPressed = inject<boolean>('submitPressed');
const invalid = computed(() => props.node.validationState.violation?.valid === false);
const renderKey = ref(1);

const inputValue = computed({
	get() {
		return props.node.currentState.value;
	},
	set(value) {
		const filteredValue = value.replace(/[^0-9,\.\-]/g, '');
		props.node.setValue(filteredValue);
		// Increment renderKey to refresh UI with filtered value.
		renderKey.value++;
	},
});
</script>

<template>
	<InputText
		:id="node.nodeId"
		:key="renderKey"
		v-model="inputValue"
		:required="node.currentState.required"
		:disabled="node.currentState.readonly"
		:class="{'inside-highlighted': invalid && submitPressed}"
		inputmode="numeric"
		@input="doneAnswering = false"
		@blur="doneAnswering = true"
	/>
</template>
