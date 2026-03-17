<script setup lang="ts">
import ControlText from '@/components/form-elements/ControlText.vue';
import type { ObjectURL } from '@/components/OdkWebForm.vue';
import type { UploadNode } from '@getodk/xforms-engine';
import Message from 'primevue/message';
import Panel from 'primevue/panel';
import { computed, ref } from 'vue';
import UploadFileHeader from './UploadFileHeader.vue';
import UploadFilePreview from './UploadFilePreview.vue';
import UploadImageHeader from './UploadImageHeader.vue';
import UploadImagePreview from './UploadImagePreview.vue';

// TODO dialog for deletion confirmation
// TODO actually try a submission to central
// TODO video upload: https://github.com/getodk/web-forms/issues/702

// TODO design questions
// - drag multiple just picks the first
// - uploading/dragging replaces selected file
// - dimensions of thumbnail - 100px by 100px
// - ignore file icons?
// - spinner isn't needed - loading into the browser is instant even for 100MB files
// - rationale for not preserving file name: https://github.com/getodk/web-forms/blob/36713a68cf8a6d0369b1941d4ba193f0556ba628/packages/web-forms/src/lib/init/engine-config.ts#L19
// - max size limit from central: https://github.com/getodk/central/blob/fd1777505d3dd4c4e343f8298d9cffb7d5b2d01b/files/nginx/odk.conf.template#L110

const MAX_FILE_SIZE = 100_000_000; // 100MB

export interface UploadControlProps {
	readonly question: UploadNode;
}

const props = defineProps<UploadControlProps>();

const isDisabled = computed(() => props.question.currentState.readonly === true);
const fileName = computed(() => props.question.currentState.value?.name ?? '');
const accept = computed(() => props.question.nodeOptions.media.accept); // TODO does this work for image/video picker?
const fileError = ref<string | null>(null);

const imageURL = computed((previous: ObjectURL | null = null) => {
	if (previous != null) {
		URL.revokeObjectURL(previous);
	}

	const file = props.question.currentState.value;
	if (!file?.type.startsWith('image/')) {
		return null;
	}

	return URL.createObjectURL(file) satisfies string as ObjectURL;
});

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

const onChange = (file: File | null) => {
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
</script>

<template>
	<ControlText :question="question" />

	<Panel>
		<template #header>
			<template v-if="question.nodeOptions.media.type === 'image'">
				<!-- TODO compute this -->
				<UploadImageHeader :question="question" :is-disabled="isDisabled" @change="onChange" />
			</template>
			<template v-else>
				<UploadFileHeader :question="question" :accept="accept" :is-disabled="isDisabled" @change="onChange" />
			</template>
		</template>
		<template #default>
			<div class="drag-and-drop" :class="{ 'disabled': isDisabled }" @drop.prevent.stop="onDrop" @dragover.prevent>
				<div v-if="question.currentState.value" class="upload-content">
					<template v-if="question.nodeOptions.media.type === 'image'">
						<UploadImagePreview :is-disabled="isDisabled" :image="imageURL" @clear="clearValue" />
					</template>
					<template v-else>
						<UploadFilePreview :file-name="fileName" :image="imageURL" @clear="clearValue" />
					</template>
				</div>
				<!-- TODO: translations -->
				<Message
					v-else-if="fileError"
					severity="error"
					:closable="true"
					@close="fileError = null"
				>
					{{ fileError }}
				</Message>
				<div v-else class="placeholder">
					Drag and drop files here to upload
				</div>
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
			padding: 0;
		}
		.upload-content.disabled {
			color: var(--odk-muted-text-color);
		}
	}
}

.drag-and-drop {
	--odk-file-upload-padding: 30px; // TODO replace with global variable once this is merged: https://github.com/getodk/web-forms/pull/737

	padding: var(--odk-file-upload-padding);

	&.disabled {
		color: var(--odk-muted-text-color);
	}
	.placeholder {
		text-align: center;
	}
}
</style>
