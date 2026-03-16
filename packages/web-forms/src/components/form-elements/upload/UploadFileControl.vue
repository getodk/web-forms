<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import ControlText from '@/components/form-elements/ControlText.vue';
import type { UploadNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Panel from 'primevue/panel';
import type { HTMLInputElementEvent } from 'vue';
import { computed, ref } from 'vue';

type ObjectURL = `blob:${string}`;
const MAX_FILE_SIZE = 100_000_000; // 100MB

export interface UploadFileControlProps {
	readonly question: UploadNode;
}

const props = defineProps<UploadFileControlProps>();

const isDisabled = computed(() => props.question.currentState.readonly === true);
const fileName = computed(() => props.question.currentState.value?.name);
const accept = computed(() => props.question.nodeOptions.media.accept);
const isImage = computed(() => props.question.currentState.value?.type === 'image/png');
const fileError = ref<string | null>(null);

const takeFileInput = ref<HTMLInputElement | null>(null);

const triggerInputField = (inputField: HTMLInputElement | null) => {
	if (inputField == null) {
		return;
	}

	inputField.click();
};

const validateFile = (file: File) => {
	if (file.size > MAX_FILE_SIZE) {
		// TODO translations
		fileError.value = 'Selected file size exceeds the maximum allowed 100MB';
		return false;
	}

	// accept everything
	if (accept.value === '*') {
		fileError.value = null;
		return true;
	}

	// "video/*,image/*,.txt,.pdf"
	const acceptParts = accept.value.split(',').map((part) => part.trim());
	for (const part of acceptParts) {
		if (part.startsWith('.')) {
			// looks like an extension check
			if (file.name.endsWith(part)) {
				fileError.value = null;
				return true;
			}
		} else {
			// looks like a mimetype
			const type = file.type.split('/')[0];
			if (part === `${type}/*` || part === file.type) {
				fileError.value = null;
				return true;
			}
		}
	}

	// TODO translations
	fileError.value = 'Selected file type does not match expected ' + accept.value;
	return false;
};

const updateValue = (file: File) => {
	if (isDisabled.value) {
		return;
	}
	props.question.setValue(validateFile(file) ? file : null);
};

const clearValue = () => {
	if (isDisabled.value) {
		return;
	}
	fileError.value = null;
	props.question.setValue(null);
};

const onChange = (event: HTMLInputElementEvent) => {
	const file = event.target.files?.[0];
	if (file) {
		updateValue(file);
	} else {
		clearValue();
	}
};

const onDrop = (event: DragEvent) => {
	const files = event.dataTransfer?.files;
	if (files && files.length > 0 && files[0]) {
		updateValue(files[0]);
	}
};

// TODO this is copied from UploadImagePreview - share code somehow
const imageURL = computed((previous: ObjectURL | null = null) => {
	if (previous != null) {
		URL.revokeObjectURL(previous);
	}

	const file = props.question.currentState.value;
	if (file == null) {
		return null;
	}

	return URL.createObjectURL(file) satisfies string as ObjectURL;
});

// TODO the whole file upload thing should be a component - we're going to need it later
// TODO dialog for deletion confirmation
// TODO actually try a submission to central

// TODO design questions
// - drag and drop doesn't make sense on mobile, right? Change message or hide body?
// - drag multiple just picks the first
// - uploading/dragging replaces selected file
// - dimensions of thumbnail - 100px by 100px
// - ignore file icons?
// - spinner isn't needed - loading into the browser is instant even for 100MB files
// - rationale for not preserving file name: https://github.com/getodk/web-forms/blob/36713a68cf8a6d0369b1941d4ba193f0556ba628/packages/web-forms/src/lib/init/engine-config.ts#L19
// - max size limit from central: https://github.com/getodk/central/blob/fd1777505d3dd4c4e343f8298d9cffb7d5b2d01b/files/nginx/odk.conf.template#L110
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
				:accept="accept"
				style="display: none"
				@change="onChange"
			>
		</template>

		<template #default>
			<div class="upload-content" :class="{ 'disabled': isDisabled }" @drop.prevent.stop="onDrop" @dragover.prevent>
				<template v-if="props.question.currentState.value">
					<img v-if="isImage && imageURL" :src="imageURL" :alt="fileName" class="upload-thumbnail">
					<span>{{ fileName }}</span>
					<Button severity="secondary" @click="clearValue()">
						<IconSVG name="mdiClose" variant="muted" size="sm" />
					</Button>
				</template>
				<!-- TODO: translations -->
				<Message
					v-else-if="fileError"
					severity="error"
					:closable="true"
					@close="fileError = null"
				>
					{{ fileError }}
				</Message>
				<span v-else class="placeholder">Drag and drop files here to upload</span>
			</div>
		</template>
	</Panel>
</template>

<style scoped lang="scss">
.p-panel {
	--odk-file-upload-padding: 30px;

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
			padding: 0;
		}
		.upload-content {
			display: flex;
			align-items: center;
			gap: var(--odk-file-upload-padding);
			padding: var(--odk-file-upload-padding);
		}
		.upload-content.disabled {
			color: var(--odk-muted-text-color);
		}
		.upload-content span {
			flex-grow: 2;
		}
		.placeholder {
			text-align: center;
		}
		.upload-thumbnail {
			max-height: 100px;
			max-width: 100px;
			width: auto;
			height: auto;
			object-fit: contain;
			vertical-align: middle;
		}
	}
}
</style>
