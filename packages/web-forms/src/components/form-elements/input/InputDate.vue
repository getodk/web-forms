<script setup lang="ts">
import { ISO_DATE_LIKE_PATTERN } from '@getodk/common/constants/datetime.ts';
import type { DateInputNode } from '@getodk/xforms-engine';
import DatePicker from 'primevue/datepicker';
import { computed } from 'vue';
import { useDateTimeInput } from './useDateTimeInput.ts';

interface InputDateProps {
	readonly question: DateInputNode;
}

const props = defineProps<InputDateProps>();
const { localeDateFormat } = useDateTimeInput();

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
	<DatePicker
		v-model="value"
		show-icon
		icon-display="input"
		:placeholder="localeDateFormat"
		show-button-bar
		:disabled="isDisabled"
	/>
</template>
