<script setup lang="ts">
import type { DecimalInputNode } from '@getodk/xforms-engine';
import InputNumeric from './InputNumeric.vue';

const MAX_DIGITS = 15;

interface InputDecimalProps {
	readonly node: DecimalInputNode;
}

const props = defineProps<InputDecimalProps>();

const setNumberValue = (value: number | null): void => {
	props.node.setValue(value);
};
</script>

<template>
	<InputNumeric
		:node="node"
		:numeric-value="props.node.currentState.value"
		:set-numeric-value="setNumberValue"
		:is-decimal="true"
		:max-digits="MAX_DIGITS"
	/>
</template>
