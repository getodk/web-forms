<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import ControlText from '@/components/form-elements/ControlText.vue';
import type { UploadNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import Panel from 'primevue/panel';
import type { HTMLInputElementEvent } from 'vue';
import { computed, ref } from 'vue';

export interface UploadFileControlProps {
	readonly question: UploadNode;
}

const props = defineProps<UploadFileControlProps>();

const isDisabled = computed(() => props.question.currentState.readonly === true);
const takeFileInput = ref<HTMLInputElement | null>(null);

const triggerInputField = (inputField: HTMLInputElement | null) => {
	if (inputField == null) {
		return;
	}

	inputField.click();
};

const updateValue = (file: File | null) => {
	props.question.setValue(file);
};

const onChange = (event: HTMLInputElementEvent) => {
	updateValue(event.target.files?.[0] ?? null);
};

const clearValue = () => {
	updateValue(null);
};
</script>

<template>

	<ControlText :question="question" />

	<Panel>
		<template #header>
			<Button
				class="take-picture-button"
				:disabled="isDisabled"
				@click="triggerInputField(takeFileInput)"
				>
				<IconSVG name="mdiPaperclip" variant="inverted" size="sm" />
				<!-- TODO: translations -->
				<span>Choose file</span>
			</Button>
			<input
				ref="takeFileInput"
				type="file"
				:accept="question.nodeOptions.media.accept"
				style="display: none"
				@change="onChange"
			>
		</template>

		<template #default>
			<div v-if="!props.question.currentState.value" class="placeholder">Drag and drop files here to upload</div>
			<div v-else>
				{{ props.question.currentState.value.name }}
				<Button severity="secondary" @click="clearValue()">
					<IconSVG name="mdiClose" variant="muted" size="sm" />
				</Button>
			</div>
		</template>
	</Panel>

</template>

<style scoped lang="scss">
.p-panel {
	background: var(--odk-base-background-color);
	box-shadow: none;
	border: 1px solid var(--odk-border-color);

	:deep(.p-panel-header) {
		border-radius: var(--odk-radius) var(--odk-radius) 0 0;
		background: var(--odk-light-background-color);
	}

	:deep(.p-panel-content-container) {
		.p-panel-content {
			border-top: 1px solid var(--odk-border-color);
			padding: 30px;
		}
		.placeholder {
			text-align: center;
		}
	}
}
</style>
