<script setup lang="ts">
import type { DecimalInputNode } from '@getodk/xforms-engine';
import PrimeInputNumber from 'primevue/inputnumber';
import { computed, inject, ref, watchEffect } from 'vue';

interface InputDecimalProps {
	readonly node: DecimalInputNode;
}

const props = defineProps<InputDecimalProps>();

const decimalValue = ref(props.node.currentState.value);

watchEffect(() => {
	props.node.setValue(decimalValue.value);
});

const doneAnswering = inject<boolean>('doneAnswering');
const submitPressed = inject<boolean>('submitPressed');
const invalid = computed(() => props.node.validationState.violation?.valid === false);
</script>

<template>
	<PrimeInputNumber
		:id="node.nodeId"
		v-model="decimalValue"
		:required="node.currentState.required"
		:disabled="node.currentState.readonly"
		:class="{'inside-highlighted': invalid && submitPressed}"
		variant="filled"
		:show-buttons="true"
		:min-fraction-digits="0"
		:max-fraction-digits="18"
		@input="doneAnswering = false"
		@blur="doneAnswering = true"
	/>
</template>
