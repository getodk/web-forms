<script setup lang="ts">
import { ISO_TIME_WITH_OPTIONAL_OFFSET_PATTERN } from '@getodk/common/constants/datetime.ts';
import type { TimeInputNode } from '@getodk/xforms-engine';
import DatePicker from 'primevue/datepicker';
import { computed } from 'vue';

const props = defineProps<{ readonly question: TimeInputNode }>();

const isDisabled = computed(() => props.question.currentState.readonly === true);

const value = computed({
	get: () => {
		if (props.question.currentState.value == null) {
			return null;
		}

		const temporalValue = props.question.currentState.value.toString();
		if (!ISO_TIME_WITH_OPTIONAL_OFFSET_PATTERN.test(temporalValue)) {
			return null;
		}

		const today = new Date();
		const yyyy = today.getFullYear();
		const mm = String(today.getMonth() + 1).padStart(2, '0');
		const dd = String(today.getDate()).padStart(2, '0');
		return new Date(`${yyyy}-${mm}-${dd}T${temporalValue}`);
	},
	set: (newTime) => {
		props.question.setValue(newTime);
	},
});
</script>

<template>
	<DatePicker v-model="value" time-only hour-format="12" :disabled="isDisabled" />
</template>
