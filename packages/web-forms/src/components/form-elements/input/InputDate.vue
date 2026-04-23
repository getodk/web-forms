<script setup lang="ts">
import { ISO_DATE_LIKE_PATTERN } from '@getodk/common/constants/datetime.ts';
import type { DateInputNode } from '@getodk/xforms-engine';
import DatePicker from 'primevue/datepicker';
import { computed } from 'vue';
import { useDateTimeInput } from './useDateTimeInput.ts';

const props = defineProps<{ readonly question: DateInputNode }>();
const { localeDateFormat, getTemporalString } = useDateTimeInput();

const isMonthYear = computed(() => props.question.appearances['month-year']);
const isYearOnly = computed(() => props.question.appearances.year);

const view = computed(() => {
	if (isMonthYear.value) {
		return 'month';
	}

	if (isYearOnly.value) {
		return 'year';
	}

	return 'date';
});

const value = computed({
	get: () => {
		const temporalValue = getTemporalString(props.question.currentState.value, ISO_DATE_LIKE_PATTERN);
		// Convert to ISO string (yyyy-mm-dd) and append time for start of day local
		return temporalValue === null ? null : new Date(temporalValue + 'T00:00:00');
	},
	set: (newDate) => {
		if (newDate != null) {
			// Normalize to first day of month or first day of year
			if (isMonthYear.value || isYearOnly.value) {
				newDate.setDate(1);
			}

			if (isYearOnly.value) {
				newDate.setMonth(0);
			}
		}
		props.question.setValue(newDate);
	},
});

const isDisabled = computed(() => props.question.currentState.readonly === true);
</script>

<template>
	<DatePicker
		v-model="value"
		:view="view"
		show-icon
		icon-display="input"
		:panel-class="isMonthYear || isYearOnly ? 'hide-today-button' : undefined"
		:placeholder="localeDateFormat"
		show-button-bar
		:disabled="isDisabled"
	/>
</template>
