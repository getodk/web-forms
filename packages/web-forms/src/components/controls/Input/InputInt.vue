<script setup lang="ts">
import type { IntInputNode } from '@getodk/xforms-engine';
import PrimeInputNumber from 'primevue/inputnumber';
import { computed, inject, ref, watchEffect } from 'vue';

interface InputIntProps {
	readonly node: IntInputNode;
}

const props = defineProps<InputIntProps>();

const toNumberValue = (value: bigint | number | string | null): number | null => {
	if (value == null || value === '') {
		return null;
	}

	return Number(value);
};

const numberValue = ref(toNumberValue(props.node.currentState.value));

watchEffect(() => {
	props.node.setValue(toNumberValue(numberValue.value));
});

const doneAnswering = inject<boolean>('doneAnswering');
const submitPressed = inject<boolean>('submitPressed');
const invalid = computed(() => props.node.validationState.violation?.valid === false);
</script>

<template>
	<PrimeInputNumber
		:id="node.nodeId"
		v-model="numberValue"
		:required="node.currentState.required"
		:disabled="node.currentState.readonly"
		:class="{'inside-highlighted': invalid && submitPressed}"
		variant="filled"
		:show-buttons="true"
		@input="doneAnswering = false"
		@blur="doneAnswering = true"
	/>
</template>
