<script setup lang="ts">
import { computed } from 'vue';
import Calendar from 'primevue/calendar';
import type { DateInputNode } from '@getodk/xforms-engine';

interface InputDateProps {
	readonly question: DateInputNode;
}

const props = defineProps<InputDateProps>();

const value = computed({
	get: () => {
		const temporalValue = props.question.currentState.value;

		if (temporalValue == null) {
			return null;
		}

		if (temporalValue instanceof Temporal.ZonedDateTime) {
			return temporalValue.toInstant().toJSDate();
		}

		// For PlainDate and PlainDateTime, use ISO string with UTC assumption
		const time = (temporalValue instanceof Temporal.PlainDate ? 'T00:00:00Z' : 'Z');
		return new Date(temporalValue.toString() + time);
	},
	set: (newDate) => {
		props.question.setValue(newDate);
	},
});

const isDisabled = computed(() => props.question.currentState.readonly === true);

</script>

<template>
	<Calendar v-model="value" showIcon iconDisplay="input" showButtonBar :disabled="isDisabled"/>
</template>

<style lang="scss">
.p-calendar {
	width: 50%;
}

.p-calendar input.p-inputtext {
	border-radius: 10px;
	border: 1px solid var(--surface-300);
	background: var(--surface-0);
	padding: 15px;
	opacity: 1;

	&:hover {
		border-color: var(--primary-500);
	}

	&:disabled {
		cursor: not-allowed;
		border-color: var(--surface-300);
	}
}

.p-calendar.p-calendar-disabled .p-datepicker-trigger-icon {
	cursor: not-allowed;
}
</style>
