<script setup lang="ts">
import InputText from 'primevue/inputtext';
import type { StringInputNode } from '@getodk/xforms-engine';
import { type ComponentPublicInstance, computed, inject, nextTick, ref, watch } from 'vue';

interface InputNumbersAppearanceProps {
	readonly node: StringInputNode;
}

const props = defineProps<InputNumbersAppearanceProps>();

const inputRef = ref<ComponentPublicInstance | null>(null);
const doneAnswering = inject<boolean>('doneAnswering');
const submitPressed = inject<boolean>('submitPressed');
const invalid = computed(() => props.node.validationState.violation?.valid === false);
const renderKey = ref(1);

const inputValue = computed({
	get() {
		return props.node.currentState.value;
	},
	set(value) {
		// Remove characters that are not digits, commas, periods, or minus signs
		const filteredValue = value.replace(/[^0-9,.-]/g, '');
		props.node.setValue(filteredValue);

		if (value !== filteredValue) {
			// Re-render to display cleaned value
			renderKey.value++;
		}
	},
});

// After re-render, refocus input so user can continue typing seamlessly
watch(renderKey, async () => nextTick(() => (inputRef.value?.$el as HTMLElement)?.focus()));
</script>

<template>
	<InputText
		:id="node.nodeId"
		:key="renderKey"
		ref="inputRef"
		v-model="inputValue"
		:required="node.currentState.required"
		:disabled="node.currentState.readonly"
		:class="{'inside-highlighted': invalid && submitPressed}"
		inputmode="numeric"
		@input="doneAnswering = false"
		@blur="doneAnswering = true"
	/>
</template>
