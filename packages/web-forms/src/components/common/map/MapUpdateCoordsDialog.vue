<script setup lang="ts">
import {
	createGeoJSONGeometry,
	parseSingleFeatureFromGeoJSON,
} from '@/components/common/map/geojson-parsers.ts';
import type { SingleFeatureType } from '@/components/common/map/getModeConfig.ts';
import { getValidCoordinates } from '@/components/common/map/map-helpers.ts';
import type { Geometry, LineString, Point, Polygon } from 'geojson';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import IconSVG from '@/components/common/IconSVG.vue';
import { ref, watch } from 'vue';

const props = defineProps<{
	visible: boolean;
	singleFeatureType?: SingleFeatureType;
}>();

const emit = defineEmits(['update:visible', 'save']);

const pasteValue = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const isParsing = ref(false);
const error = ref<string | null>(null);

const openFileChooser = () => fileInput.value?.click();

const selectFile = (event: Event) => {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];
	if (!file) {
		resetSelectedFile();
		return;
	}

	resetError();
	pasteValue.value = '';
	selectedFile.value = file;
};

const parseFileCoordinates = async (file: File): Promise<Geometry | undefined> => {
	try {
		const text = await file.text();
		if (!text?.trim()?.length) {
			// TODO: translations
			setErrorIfBlank('File is empty.');
			return;
		}

		const fileName = file.name.toLowerCase();
		if (fileName.endsWith('.geojson')) {
			return parseSingleFeatureFromGeoJSON(text);
		}

		// TODO: translations
		setErrorIfBlank('Unsupported file type. Please upload a .geojson file.');
	} catch {
		// TODO: translations
		setErrorIfBlank('Failed to parse file. Ensure it is a valid GeoJSON.');
	}
};

const parsePastedValue = () => {
	const value = pasteValue.value.trim();
	if (!value.length) {
		return;
	}

	return createGeoJSONGeometry(value);
};

const save = async () => {
	resetError();
	isParsing.value = true;
	let geometry;
	if (selectedFile.value) {
		geometry = await parseFileCoordinates(selectedFile.value);
	} else if (pasteValue.value.length) {
		geometry = parsePastedValue();
	}

	const coordinates = getValidCoordinates(
		geometry as LineString | Point | Polygon | undefined,
		props.singleFeatureType
	);
	isParsing.value = false;

	if (!coordinates?.length) {
		// TODO: translations
		setErrorIfBlank('Incorrect geometry type.');
		return;
	}

	close();
	emit('save', coordinates);
};

const close = () => {
	reset();
	emit('update:visible', false);
};

const reset = () => {
	pasteValue.value = '';
	isParsing.value = false;
	resetSelectedFile();
	resetError();
};

const resetSelectedFile = () => {
	selectedFile.value = null;
	if (fileInput.value) {
		fileInput.value.value = '';
	}
};

const resetError = () => (error.value = null);

const setErrorIfBlank = (message: string) => (error.value ??= message);

watch(pasteValue, (newVal) => {
	resetError();
	if (newVal && selectedFile.value) {
		resetSelectedFile();
	}
});
</script>

<template>
	<Dialog
		:visible="visible"
		modal
		class="map-paste-dialog"
		:draggable="false"
		@update:visible="emit('update:visible', $event)"
		@after-hide="reset"
	>
		<template #header>
			<!-- TODO: translations -->
			<strong>Import location data</strong>
		</template>

		<template #default>
			<div class="dialog-field-container">
				<!-- TODO: translations -->
				<label for="paste-input">Paste ODK format to replace current location</label>
				<InputText id="paste-input" v-model="pasteValue" :disabled="isParsing" />
			</div>

			<div class="dialog-field-container">
				<!-- TODO: translations -->
				<label>Or upload GeoJSON to replace the location</label>
				<!-- TODO: translations -->
				<span v-if="selectedFile"><i>File uploaded</i></span>
				<Button outlined severity="contrast" :disabled="isParsing" @click="openFileChooser">
					<IconSVG name="mdiUpload" />
					<!-- TODO: translations -->
					<span>Upload file</span>
				</Button>

				<input
					ref="fileInput"
					type="file"
					accept=".geojson,application/json"
					@change="selectFile"
				>
			</div>
		</template>

		<template #footer>
			<p v-if="error?.length" class="coords-error-message">
				{{ error }}
			</p>
			<Button label="Save" :disabled="!selectedFile && !pasteValue.length" @click="save" />
		</template>
	</Dialog>
</template>

<style scoped lang="scss">
.dialog-field-container {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 10px;

	label {
		font-size: var(--odk-base-font-size);
		color: var(--odk-text-color);
	}

	input[type='file'] {
		display: none;
	}

	input[type='text'] {
		width: 100%;
		padding: 9px;
	}
}

.coords-error-message {
	display: block;
	color: var(--odk-error-text-color);
	margin-bottom: 10px;
}
</style>

<style lang="scss">
// Global overrides for this dialog
.p-dialog.map-paste-dialog {
	background: var(--odk-base-background-color);
	border-radius: var(--odk-radius);
	margin: 0 24px;
	width: 550px;

	.p-dialog-header {
		padding: 15px 20px;
		font-size: var(--odk-dialog-title-font-size);
	}

	.p-dialog-content {
		display: flex;
		flex-direction: column;
		gap: 35px;
		padding: 20px;
	}

	.p-dialog-footer button {
		font-size: var(--odk-base-font-size);
	}
}
</style>
