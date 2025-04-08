<script setup lang="ts">
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import { RouterLink } from 'vue-router';

import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';

import { computed, ref, watch, type HTMLInputElementEvent } from 'vue';
import { useConfiguration } from './composables/configuration';
import { useXlsFormOnline } from './composables/xlsform-online';

const fileInput = ref();
const highlighted = ref(false);
const uploadedFilename = ref('');

const xformUrl = ref<string | null>(null);

const error = ref<string>('');
const warnings = ref<string[]>([]);

const formUploading = ref<boolean>(false);

const { data: config, error: configErrors } = useConfiguration();

const xlsformOnlineBaseUrl = computed(() => config.value?.['xlsform-online-url']);

const inDevMode = import.meta.env.DEV;

const bypassConverterForXml = ref<boolean>(false);

watch(configErrors, (value) => {
	if (value) {
		error.value =
			'Failed to load configuration, please refresh the page. If problem persists, please report it on ODK Forum.';
	}
});

const { convertXlsForm } = useXlsFormOnline(xlsformOnlineBaseUrl);

const fileChangeHandler = async (e: HTMLInputElementEvent) => {
	if (e.target?.files?.length == 1) {
		await uploadFile(e.target.files[0]);
	}
};

const getFileExtension = (filename: string) => {
	const parts = filename.split('.');
	return parts.length > 1 ? parts.pop()! : '';
};

const fileDropHandler = async (e: DragEvent) => {
	highlighted.value = false;

	// short-circuit if a file is being uploaded
	if (formUploading.value) {
		return;
	}

	if (!e.dataTransfer || e.dataTransfer.files.length == 0) {
		return;
	}

	if (e.dataTransfer.files.length > 1) {
		error.value = 'You can upload only one file at a time.';
		return;
	}

	if (!['xlsx', 'xls', 'xml'].includes(getFileExtension(e.dataTransfer.files[0].name))) {
		error.value = 'Please upload an Excel file (.xls or .xlsx).';
		return;
	}

	await uploadFile(e.dataTransfer.files[0]);
};

const uploadFile = async (file: File) => {
	formUploading.value = true;
	reset();
	uploadedFilename.value = file.name;

	if (bypassConverterForXml.value && file.name.endsWith('.xml')) {
		xformUrl.value = URL.createObjectURL(file); // leaks; in non-demo code, we might want to deallocate the object URL at some point.
	} else {
		const { data: response, error: conversionError } = await convertXlsForm(file);

		if (conversionError) {
			error.value = conversionError;
		} else if (response) {
			if (response.error) {
				error.value = response.error;
			} else if (response.xform_url) {
				xformUrl.value = response.xform_url;
			}

			if (response.warnings && response.warnings.length > 0) {
				warnings.value = response.warnings;
			}
		}
	}

	formUploading.value = false;
};

const toggleHighlight = () => {
	// short-circuit if a file is being uploaded
	if (formUploading.value) {
		return;
	}

	highlighted.value = !highlighted.value;
};

const reset = () => {
	uploadedFilename.value = '';
	error.value = '';
	warnings.value = [];
	xformUrl.value = null;
};

// Prevent file drop on rest of the page
document.addEventListener(
	'dragover',
	function (e) {
		e.preventDefault();
	},
	false
);

document.addEventListener(
	'drop',
	function (e) {
		e.preventDefault();
	},
	false
);
</script>

<template>
	<div class="form-upload-component">
		<template v-if="xformUrl == null">
			<div
				:class="{ dropbox: true, highlighted: highlighted }"
				@drop.prevent="fileDropHandler"
				@dragenter.prevent="toggleHighlight"
				@dragleave.prevent="toggleHighlight"
			>
				<template	v-if="!formUploading">
					<input ref="fileInput" type="file" hidden accept=".xls, .xlsx, .xml" @change="fileChangeHandler">
					<span>
						<span class="icon-insert_drive_file" />
						Drag and drop XLSForm or <a href="javascript:;" class="upload-file-link" @click="fileInput.click()">upload form</a>
					</span>
					<template v-if="inDevMode">
						<label>
							<input
								v-model="bypassConverterForXml" type="checkbox"
							>
							Bypass converter for <code>XML</code> upload
						</label>
					</template>
				</template>
				<template v-else>
					<ProgressSpinner class="spinner" />
					<span>
						Uploading form
					</span>
				</template>
			</div>
		</template>

		<div v-else class="preview-wrapper">
			<IconField icon-position="left" class="textbox-with-icon">
				<InputIcon class="icon-insert_drive_file" />
				<InputText :value="uploadedFilename" class="uploaded-file-textbox" />
				<Button class="clear-button" icon="icon-clear" text rounded aria-label="Cancel" @click="reset()" />
			</IconField>

			<div class="action-buttons">
				<Button label="Upload new Form" icon="icon-file_upload" class="upload-new-button" severity="contrast" variant="outlined" @click="reset" />
				<RouterLink :to="`/form?url=${xformUrl}`" target="_blank" class="preview-link">
					<Button label="Preview Form" icon="icon-remove_red_eye" class="preview-link-button" />
				</RouterLink>
			</div>
		</div>

		<Message v-if="error" severity="error" icon="icon-error" @close="reset()">
			{{ error }}
		</Message>
		<Message v-if="warnings?.length > 0" severity="warn" icon="icon-warning">
			<span>There are following possible problems in the uploaded Form:</span>
			<ul>
				<li v-for="warning in warnings" :key="warning">
					{{ warning }}
				</li>
			</ul>
		</Message>
	</div>
</template>

<style scoped lang="scss">
.spinner {
	width: 40px;
	height: 40px;
}

.form-upload-component {
	display: flex;
	flex-direction: column;
	gap: 14px;

	.dropbox {
		border: 1px dashed black;
		border-radius: var(--odk-radius);
		background-color: var(--odk-primary-lighter-background-color);
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
		gap: 1rem;
		padding: 1rem;
		font-size: var(--odk-group-font-size);
		font-weight: 300;
	}

	.dropbox.highlighted {
		border-color: var(--odk-border-color);
		background-color: var(--odk-primary-light-background-color);
	}

	a.upload-file-link {
		font-weight: 400;
		color: var(--odk-primary-text-color);
	}

	.preview-wrapper {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;

		.textbox-with-icon {
			width: 100%;

			.uploaded-file-textbox {
				width: 100%;
				padding-right: 3rem;
				padding-top: 11px;
				padding-bottom: 11px;
			}

			.p-inputicon {
				color: var(--odk-muted-text-color);
			}

			.clear-button {
				position: absolute;
				margin-top: 3px;
				right: 1rem;
				color: var(--odk-text-color);

				&:hover,
				&:active {
					color: var(--odk-text-color);
					background: unset;
					outline: unset;
				}
			}
		}

		.action-buttons {
			display: flex;
			flex-direction: row;
			gap: 1rem;
			flex-wrap: wrap;
			justify-content: center;
		}
	}

	:deep(.p-message .p-message-wrapper) {
		padding: 0.5rem 1rem;
		white-space: pre-line;
		align-items: start;

		ul {
			margin-bottom: 0;
			padding-left: 1rem;
		}

		.p-message-icon {
			line-height: 2.5rem;
		}

		.p-message-text {
			min-height: 2.5rem;
			display: flex;
			flex-direction: column;
			justify-content: center;
		}
	}

	:deep(.p-button) {
		.p-button-icon {
			flex-grow: 1;
			text-align: right;
		}
		.p-button-label {
			text-align: left;
		}
	}
}
</style>
