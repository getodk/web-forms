<script setup lang="ts">
import { computed } from 'vue';
import Calendar from 'primevue/calendar';
import type { DateInputNode } from '@getodk/xforms-engine';
import { ISO_DATE_LIKE_PATTERN } from '@getodk/common/constants/datetime.ts';

interface InputDateProps {
	readonly question: DateInputNode;
}

const props = defineProps<InputDateProps>();

const value = computed({
	get: () => {
		if (props.question.currentState.value == null) {
			return null;
		}

		const temporalValue = props.question.currentState.value.toString();
		if (!ISO_DATE_LIKE_PATTERN.test(temporalValue)) {
			return null;
		}

		// Convert to ISO string (yyyy-mm-dd) and append time for start of day local
		return new Date(temporalValue + 'T00:00:00');
	},
	set: (newDate) => {
		props.question.setValue(newDate);
	},
});

const isDisabled = computed(() => props.question.currentState.readonly === true);
</script>

<template>
	<Calendar v-model="value" show-icon icon-display="input" show-button-bar :disabled="isDisabled" />
</template>

<style lang="scss">
@import 'primeflex/core/_variables.scss';

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

@media screen and (max-width: #{$sm}) {
	.p-calendar {
		width: 100%;
	}
}
</style>
