<script setup lang="ts">
import { getGeoJSONCoordinates } from '@/components/common/map/createFeatureCollectionAndProps.ts';
import type { DrawFeatureType } from '@/components/common/map/useMapInteractions.ts';
import type { FeatureCollection, LineString, Point, Polygon } from 'geojson';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import IconSVG from '@/components/common/IconSVG.vue';
import { ref, computed, watch } from 'vue';
import type { Coordinate } from 'ol/coordinate';

defineProps<{
	visible: boolean;
	drawFeatureType?: DrawFeatureType;
}>();

const emit = defineEmits(['update:visible', 'save']);

const pasteValue = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const isParsing = ref(false);
const error = ref<string | null>(null);

const hasPastedValue = computed(() => pasteValue.value.trim().length > 0);

const openFileChooser = () => fileInput.value?.click();

const selectFile = (event: Event) => {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];
	if (!file) {
		return;
	}

	pasteValue.value = '';
	selectedFile.value = file;
	error.value = null;
};

const parseFileCoordinates = async (file: File): Promise<Coordinate[] | undefined> => {
	try {
		const text = await file.text();
		if (!text.trim()) {
			error.value = 'File is empty.';
			return;
		}

		const fileName = file.name.toLowerCase();
		if (fileName.endsWith('.geojson') || file.type === 'application/json') {
			return parseGeoJSONCoordinates(text);
		}

		if (fileName.endsWith('.csv')) {
			return parseCSVGeometry(text);
		}

		error.value = 'Unsupported file type. Please upload a .csv or .geojson file.';
	} catch {
		error.value = 'Failed to parse file. Ensure it is valid CSV or GeoJSON.';
	}
};

const parseGeoJSONCoordinates = (text: string): Coordinate[] | undefined => {
	const geojson = JSON.parse(text) as FeatureCollection<LineString | Point | Polygon>;
	const coords = geojson?.features?.[0]?.geometry?.coordinates as Coordinate[] | undefined;
	if (!Array.isArray(coords)) {
		return;
	}

	return coords;
};

const parseCSVGeometry = (text: string): Coordinate[] | undefined => {
	const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
	if (lines.length < 2) {
		return;
	}

	const header = lines[0]?.split(',') ?? [];
	const geometryIndex = header.findIndex((col) => col.trim().toLowerCase() === 'geometry');
	if (geometryIndex === -1) {
		return;
	}

	const firstDataRow = lines[1]?.split(',') ?? [];
	const geometryValue = firstDataRow[geometryIndex]?.trim() ?? '';
	return getGeoJSONCoordinates(geometryValue);
};

const parsePastedValue = () => {
	const value = pasteValue.value.trim();
	if (!value.length) {
		return;
	}

	return getGeoJSONCoordinates(value);
};

const save = async () => {
	error.value = null;
	let coordinates: Coordinate[] | undefined;
	if (selectedFile.value) {
		coordinates = await parseFileCoordinates(selectedFile.value);
	} else if (hasPastedValue.value) {
		coordinates = parsePastedValue();
	}

	if (!coordinates?.length) {
		error.value ??= 'No valid coordinates found.';
		return;
	}

	emit('save', coordinates);
	close();
};

const close = () => {
	emit('update:visible', false);
	reset();
};

const reset = () => {
	pasteValue.value = '';
	selectedFile.value = null;
	error.value = null;
	isParsing.value = false;
	if (fileInput.value) {
		fileInput.value.value = '';
	}
};

watch(pasteValue, (newVal) => {
	if (newVal && selectedFile.value) {
		selectedFile.value = null;
		if (fileInput.value) {
			fileInput.value.value = '';
		}
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
	>
		<template #header>
			<strong>Paste or upload location data</strong>
		</template>

		<template #default>
			<div class="dialog-field-container">
				<label for="paste-input">Paste the new value in ODK format</label>
				<InputText id="paste-input" v-model="pasteValue" />
			</div>

			<div class="dialog-field-container">
				<label>Or upload a GeoJSON or a CSV file</label>
				<Button outlined severity="contrast" @click="openFileChooser">
					<IconSVG name="mdiUpload" />
					<span>Upload file</span>
				</Button>

				<input
					ref="fileInput"
					type="file"
					accept=".geojson,.csv,application/json,text/csv"
					@change="selectFile"
				>
			</div>
		</template>

		<template #footer>
			<Button label="Save" :disabled="!selectedFile && !hasPastedValue" @click="save" />
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
