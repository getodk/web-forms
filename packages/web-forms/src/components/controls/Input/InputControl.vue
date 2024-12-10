<script setup lang="ts">
import type { AnyInputNode } from '@getodk/xforms-engine';
import { computed, inject, provide, ref } from 'vue';
import ControlText from '../../ControlText.vue';
import ValidationMessage from '../../ValidationMessage.vue';
import InputDecimal from './InputDecimal.vue';
import InputInt from './InputInt.vue';
import InputText from './InputText.vue';

interface InputControlProps {
	readonly node: AnyInputNode;
}

const props = defineProps<InputControlProps>();

const doneAnswering = ref(false);

provide('doneAnswering', doneAnswering);

const submitPressed = inject<boolean>('submitPressed');
const invalid = computed(() => props.node.validationState.violation?.valid === false);
</script>

<template>
	<ControlText :question="node" />

	<div class="input-control-container">
		<InputDecimal
			v-if="node.valueType === 'decimal'"
			v-model:done-answering="doneAnswering"
			v-model:submit-pressed="submitPressed"
			:node="node"
		/>
		<InputInt
			v-else-if="node.valueType === 'int'"
			v-model:done-answering="doneAnswering"
			v-model:submit-pressed="submitPressed"
			:node="node"
		/>
		<InputText
			v-else
			v-model:done-answering="doneAnswering"
			v-model:submit-pressed="submitPressed"
			:node="node"
		/>

		<i v-show="invalid && (doneAnswering || submitPressed)" class="icon-error" />
	</div>
	<ValidationMessage :message="node.validationState.violation?.message.asString" :show-message="doneAnswering || submitPressed" />
</template>

<style scoped lang="scss">
.input-control-container {
	position: relative;

	.p-inputnumber,
	.p-inputtext {
		width: 100%;
	}

	input {
		background-color: var(--surface-100);

		&.inside-highlighted {
			background-color: var(--surface-0);
		}

		&:read-only {
			cursor: not-allowed;
			opacity: 1;
			background-color: var(--surface-50);
			background-image: none;
		}

		&.p-variant-filled:enabled:hover,
		&.p-variant-filled:enabled:focus {
			background-color: var(--surface-50);
		}
	}

	.icon-error {
		position: absolute;
		inset-inline-end: 10px;
		top: 15px;
		color: var(--error-text-color);
		font-size: 1.2rem;
	}
}
</style>
