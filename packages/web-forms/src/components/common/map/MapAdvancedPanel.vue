<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import { fromLonLat, toLonLat } from 'ol/proj';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { ref, watch } from 'vue';
import type { Coordinate } from 'ol/coordinate';

const props = defineProps<{
	isOpen: boolean;
	selectedVertex: Coordinate | undefined;
}>();

const emit = defineEmits(['update-feature', 'update-vertex']);

const isDialogOpen = ref(false);
const accuracy = ref<number | undefined>();
const latitude = ref<number | undefined>();
const altitude = ref<number | undefined>();
const longitude = ref<number | undefined>();

watch(
	() => props.selectedVertex,
	(newVal) => {
		if (newVal) {
			[longitude.value, latitude.value, altitude.value, accuracy.value] = toLonLat(newVal);
			return;
		}
		accuracy.value = undefined;
		latitude.value = undefined;
		altitude.value = undefined;
		longitude.value = undefined;
	},
	{ deep: true }
);

const updateFeature = () => {
	// todo extract content from input file or input text from dialog component
	// If it's geojson file get the coordinates
	// if it's csv file get the coordinates
	// if a file was provided, it should clear the value from the input text.
	// if a value was provided to the input text, it should clear the value from the file input.
	const featureCoords = [];
	emit('update-feature', featureCoords);
};

const updateVertex = () => {
	const [originalLong, originalLat] = props.selectedVertex ?? [];
	if (!longitude.value) {
		longitude.value = originalLong;
		return;
	}

	if (!latitude.value) {
		latitude.value = originalLat;
		return;
	}

	const newVertex = [longitude.value, latitude.value];
	if (altitude.value != null) {
		newVertex.push(altitude.value);
	}

	if (accuracy.value != null) {
		newVertex.push(accuracy.value);
	}

	emit('update-vertex', fromLonLat(newVertex));
};
</script>

<template>
	<transition name="panel">
		<div v-if="isOpen" class="advanced-panel">
			<div class="fields-container">
				<div class="field-set">
					<label for="longitude">Longitude</label>
					<input id="longitude" v-model="longitude" type="number" @change="updateVertex" />
				</div>
				<div class="field-set">
					<label for="latitude">Latitude</label>
					<input id="latitude" v-model="latitude" type="number" @change="updateVertex" />
				</div>
				<div class="field-set">
					<label for="altitude">Altitude</label>
					<input id="altitude" v-model="altitude" type="number" @change="updateVertex" />
				</div>
				<div class="field-set">
					<label for="accuracy">Accuracy</label>
					<input id="accuracy" v-model="accuracy" type="number" @change="updateVertex" />
				</div>
			</div>

			<a class="paste-location" @click="isDialogOpen = true">
				<IconSVG name="mdiFileOutline" size="sm" />
				<strong>Paste location data</strong>
			</a>
		</div>
	</transition>

	<Dialog
		:visible="isDialogOpen"
		modal
		class="map-paste-dialog"
		:draggable="false"
		@update:visible="(value) => (isDialogOpen = value)"
	>
		<template #header>
			<!-- TODO: translations -->
			<strong>Paste or upload location data</strong>
		</template>

		<template #default>
			<!-- TODO: translations -->
			<div class="dialog-field-container">
				<label for="new-location-input">Paste the new value in ODK format</label>
				<InputText id="new-location-input" />
			</div>

			<div class="dialog-field-container">
				<!-- TODO: translations -->
				<label for="upload-location-file">Or upload a GeoJSON or a CSV file</label>
				<Button id="upload-location-file" outlined severity="contrast" @click="">
					<IconSVG name="mdiUpload" />
					<!-- TODO: translations -->
					<span>Upload file</span>
				</Button>
			</div>
		</template>

		<template #footer>
			<!-- TODO: translations -->
			<Button label="Save" @click="updateFeature" />
		</template>
	</Dialog>
</template>

<style scoped lang="scss">
.advanced-panel {
	--odk-double-map-spacing: calc(var(--odk-map-controls-spacing) * 2);
}

.advanced-panel {
	border-top: 1px solid var(--odk-border-color);
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 3px;
}

.fields-container {
	display: flex;
	flex-wrap: wrap;
	gap: var(--odk-double-map-spacing);
	padding: var(--odk-double-map-spacing) var(--odk-map-controls-spacing);

	.field-set {
		display: flex;
		border: 1px solid var(--odk-border-color);
		border-radius: 6px;
		overflow: hidden;
		background-color: var(--odk-muted-background-color);
		flex: 1 1 calc(50% - var(--odk-double-map-spacing));
		height: 38px;
		min-width: 250px;
	}

	label {
		padding: var(--odk-map-controls-spacing);
		background-color: var(--odk-light-background-color);
		color: var(--odk-text-color);
		font-weight: normal;
		font-size: var(--odk-base-font-size);
		display: flex;
		align-items: center;
		border-right: 1px solid var(--odk-border-color);
		white-space: nowrap;
	}

	input {
		padding: var(--odk-map-controls-spacing);
		width: 100%;
		background-color: var(--odk-base-background-color);
		border: none;
		font-size: var(--odk-base-font-size);
		color: var(--odk-text-color);

		&:focus-visible {
			outline: none;
			outline-offset: unset;
		}

		&::-webkit-outer-spin-button,
		&::-webkit-inner-spin-button {
			appearance: none;
			-webkit-appearance: none;
			margin: 0;
		}
	}
}

.paste-location {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 8px;
	padding: var(--odk-double-map-spacing);
	text-decoration: none;
	cursor: pointer;
	font-size: var(--odk-base-font-size);
	color: var(--odk-text-color);
}

.panel-enter-active,
.panel-leave-active {
	transition:
		max-height 0.6s ease-in-out,
		opacity 0.6s ease-in-out;
	overflow: hidden;
}

.panel-enter-from,
.panel-leave-to {
	max-height: 0;
	opacity: 0;
}

.panel-enter-to,
.panel-leave-from {
	max-height: 300px;
	opacity: 1;
}
</style>

<style lang="scss">
// Override PrimeVue dialog style that is outside scoped (rendered outside the component)
.p-dialog.map-paste-dialog {
	background: var(--odk-base-background-color);
	border-radius: var(--odk-radius);
	margin: 0 24px;

	.p-dialog-header {
		padding: 15px 20px;
		font-size: var(--odk-dialog-title-font-size);
	}

	.p-dialog-content {
		display: flex;
		flex-direction: column;
		gap: 35px;
	}

	.dialog-field-container {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 10px;
	}

	#new-location-input {
		width: 100%;
	}

	.p-dialog-content p,
	.p-dialog-footer button {
		font-size: var(--odk-base-font-size);
	}

	button.p-button-secondary:focus-visible {
		outline: none;
		outline-offset: unset;
	}
}
</style>
