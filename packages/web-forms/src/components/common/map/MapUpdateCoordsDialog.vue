<script setup lang="ts">
import { createGeoJSONGeometry } from '@/components/common/map/createFeatureCollectionAndProps.ts';
import {
	DRAW_FEATURE_TYPES,
	type DrawFeatureType,
} from '@/components/common/map/useMapInteractions.ts';
import { isCoordsEqual } from '@/components/common/map/vertex-geometry.ts';
import type { FeatureCollection, Geometry, LineString, Point, Polygon } from 'geojson';
import { fromLonLat } from 'ol/proj';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import IconSVG from '@/components/common/IconSVG.vue';
import { ref, computed, watch } from 'vue';
import type { Coordinate } from 'ol/coordinate';

const props = defineProps<{
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

const parseFileCoordinates = async (file: File): Promise<Geometry | undefined> => {
	try {
		const text = await file.text();
		if (!text.trim()) {
			// TODO: translations
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
		// TODO: translations
		error.value = 'Unsupported file type. Please upload a .csv or .geojson file.';
	} catch {
		// TODO: translations
		error.value = 'Failed to parse file. Ensure it is valid CSV or GeoJSON.';
	}
};

const parseGeoJSONCoordinates = (text: string): Geometry | undefined => {
	const geojson = JSON.parse(text) as FeatureCollection<LineString | Point | Polygon>;
	return geojson?.features?.[0]?.geometry;
};

const parseCSVGeometry = (text: string): Geometry | undefined => {
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
	return createGeoJSONGeometry(geometryValue) as Geometry | undefined;
};

const parsePastedValue = () => {
	const value = pasteValue.value.trim();
	if (!value.length) {
		return;
	}

	return createGeoJSONGeometry(value) as Geometry | undefined;
};

const getValidCoordinates = (geometry: LineString | Point | Polygon | undefined) => {
	if (!geometry?.coordinates) {
		return;
	}

	const coords = geometry.coordinates as Coordinate | Coordinate[] | Coordinate[][];
	if (geometry.type === 'Point' && !props.drawFeatureType && !Array.isArray(coords[0])) {
		return fromLonLat(coords as Coordinate);
	}

	const hasRing = Array.isArray(coords[0]) && Array.isArray(coords[0][0]);
	let flatCoords = (hasRing ? coords[0] : coords) as Coordinate[];
	if (!flatCoords?.length) {
		return;
	}

	flatCoords = flatCoords.map((c) => fromLonLat(c));
	const isClosed = isCoordsEqual(flatCoords[0], flatCoords[flatCoords.length - 1]);
	if (
		geometry.type === 'LineString' &&
		props.drawFeatureType === DRAW_FEATURE_TYPES.TRACE &&
		!isClosed &&
		flatCoords.length >= 2
	) {
		return flatCoords;
	}

	if (
		geometry.type === 'Polygon' &&
		props.drawFeatureType === DRAW_FEATURE_TYPES.SHAPE &&
		isClosed &&
		flatCoords.length >= 3
	) {
		return [flatCoords];
	}
};

const save = async () => {
	error.value = null;
	let geometry;
	if (selectedFile.value) {
		geometry = await parseFileCoordinates(selectedFile.value);
	} else if (hasPastedValue.value) {
		geometry = parsePastedValue();
	}

	const coordinates = getValidCoordinates(geometry as LineString | Point | Polygon | undefined);
	if (!coordinates?.length) {
		// TODO: translations
		error.value ??= 'Incorrect geometry type.';
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
		@after-hide="reset"
	>
		<template #header>
			<!-- TODO: translations -->
			<strong>Paste or upload location data</strong>
		</template>

		<template #default>
			<div class="dialog-field-container">
				<!-- TODO: translations -->
				<label for="paste-input">Paste the new value in ODK format</label>
				<InputText id="paste-input" v-model="pasteValue" />
			</div>

			<div class="dialog-field-container">
				<!-- TODO: translations -->
				<label>Or upload a GeoJSON or a CSV file</label>
				<!-- TODO: translations -->
				<span v-if="selectedFile"><i>File uploaded</i></span>
				<Button outlined severity="contrast" @click="openFileChooser">
					<IconSVG name="mdiUpload" />
					<!-- TODO: translations -->
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
			<p v-if="error?.length" class="coords-error-message">
				{{ error }}
			</p>
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
