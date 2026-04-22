<script setup lang="ts">
import { ISO_DATE_TIME_WITH_OPTIONAL_OFFSET_PATTERN } from '@getodk/common/constants/datetime.ts';
import { type DateTimeInputNode } from '@getodk/xforms-engine';
import DatePicker from 'primevue/datepicker';
import { computed } from 'vue';
import { useDateTimeInput } from './useDateTimeInput.ts';

const props = defineProps<{ readonly question: DateTimeInputNode }>();
const { localeDateFormat: baseDateFormat, hourFormat, clearSubMinute } = useDateTimeInput();

const value = computed({
	get: () => {
		if (props.question.currentState.value == null) {
			return null;
		}

		const temporalValue = props.question.currentState.value.toString();
		if (!ISO_DATE_TIME_WITH_OPTIONAL_OFFSET_PATTERN.test(temporalValue)) {
			return null;
		}

		return new Date(temporalValue);
	},
	set: (newDateTime) => {
		if (newDateTime) {
			clearSubMinute(newDateTime);
		}
		props.question.setValue(newDateTime);
	},
});

const placeholderText = computed(() => {
	const timeFormat = hourFormat.value === '12' ? 'hh:mm AM' : 'HH:mm';
	return `${baseDateFormat.value} ${timeFormat}`;
});

const isDisabled = computed(() => props.question.currentState.readonly === true);
</script>

<template>
	<DatePicker
		v-model="value"
		show-icon
		icon-display="input"
		:placeholder="placeholderText"
		show-button-bar
		show-time
		:hour-format="hourFormat"
		:disabled="isDisabled"
	/>
</template>
