<script setup lang="ts">
import { setInputFiles } from '@getodk/common/lib/web-compat/setInputFiles';
import type { UploadNode, UploadValue } from '@getodk/xforms-engine';
import type { HTMLInputElementEvent } from 'vue';
import { computed, customRef, ref, watchEffect } from 'vue';

export interface UploadControlProps {
	readonly question: UploadNode;
}

const props = defineProps<UploadControlProps>();

const file = customRef<UploadValue>(() => {
	const currentState = computed(() => props.question.currentState.value);

	return {
		get: () => currentState.value,
		set: (fileValue: UploadValue) => {
			props.question.setValue(fileValue);
		},
	};
});

const onChange = (event: HTMLInputElementEvent): void => {
	file.value = event.target.files?.[0] ?? null;
};

const input = ref<HTMLInputElement | null>(null);

watchEffect(() => {
	const inputElement = input.value;

	if (inputElement == null) {
		return;
	}

	const fileValue = file.value;

	if (fileValue == null) {
		inputElement.value = '';
	} else {
		setInputFiles(inputElement, [fileValue]);
	}
});
</script>

<template>
	<input ref="input" type="file" @change="onChange">
</template>
