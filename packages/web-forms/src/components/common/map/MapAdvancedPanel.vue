<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import { toGeoJsonCoordinateArray } from '@/components/common/map/map-helpers.ts';
import { fromLonLat, toLonLat } from 'ol/proj';
import { ref, watch } from 'vue';
import type { Coordinate } from 'ol/coordinate';

const props = defineProps<{
	isOpen: boolean;
	selectedVertex: Coordinate | undefined;
}>();

const emit = defineEmits(['open-paste-dialog', 'save']);

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

const updateVertex = () => {
	const [originalLong, originalLat] = toLonLat(props.selectedVertex ?? []);
	const long = longitude.value ?? originalLong;
	const lat = latitude.value ?? originalLat;
	if (long === undefined || lat === undefined) {
		return;
	}

	const newVertex = toGeoJsonCoordinateArray(
		long,
		lat,
		altitude.value,
		accuracy.value
	) as Coordinate;
	emit('save', fromLonLat(newVertex));
};
</script>

<template>
	<transition name="panel">
		<div v-if="isOpen" class="advanced-panel">
			<div class="fields-container">
				<div class="field-set">
					<label for="longitude">Longitude</label>
					<input id="longitude" v-model="longitude" type="number" @change="updateVertex">
				</div>
				<div class="field-set">
					<label for="latitude">Latitude</label>
					<input id="latitude" v-model="latitude" type="number" @change="updateVertex">
				</div>
				<div class="field-set">
					<label for="altitude">Altitude</label>
					<input id="altitude" v-model="altitude" type="number" @change="updateVertex">
				</div>
				<div class="field-set">
					<label for="accuracy">Accuracy</label>
					<input id="accuracy" v-model="accuracy" type="number" @change="updateVertex">
				</div>
			</div>

			<a class="paste-location" @click="emit('open-paste-dialog')">
				<IconSVG name="mdiFileOutline" size="sm" />
				<strong>Paste location data</strong>
			</a>
		</div>
	</transition>
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
