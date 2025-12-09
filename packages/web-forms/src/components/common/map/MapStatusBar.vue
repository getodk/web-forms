<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import { getFlatCoordinates } from '@/components/common/map/vertex-geometry.ts';
import type { Coordinate } from 'ol/coordinate';
import type Feature from 'ol/Feature';
import { LineString, Point, Polygon } from 'ol/geom';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import { computed } from 'vue';

interface SavedFeatureStatus {
	message: string;
	icon: string;
	highlight?: boolean;
}

const props = defineProps<{
	savedFeature: Feature | undefined;
	selectedVertex: Coordinate | undefined;
	isCapturing: boolean;
	canRemove: boolean;
	canSave: boolean;
	canViewDetails: boolean;
}>();
const emit = defineEmits(['view-details', 'save', 'discard']);

const selectedVertexInfo = computed(() => {
	if (!props.selectedVertex || props.selectedVertex.length < 2) {
		return '';
	}

	const [longitude, latitude, altitude] = props.selectedVertex;
	const parts = [`Longitude: ${longitude}`, `Latitude: ${latitude}`];

	if (altitude !== undefined) {
		parts.push(`Altitude: ${altitude} m`);
	}

	// ToDo: Is accuracy needed?
	return parts.join(', ');
});

const savedFeatureStatus = computed<SavedFeatureStatus | null>(() => {
	const geometry = props.savedFeature?.getGeometry() as LineString | Point | Polygon | undefined;
	// TODO: translations
	if (geometry instanceof Point) {
		return { message: 'Point saved', icon: 'mdiCheckCircle', highlight: true };
	}

	const points = getFlatCoordinates(geometry).length;
	if (points === 0) {
		return null;
	}

	const message = points === 1 ? '1 point saved' : `${points} points saved`;
	if (geometry instanceof LineString) {
		return { message, icon: 'mdiVectorPolyline' };
	}

	if (geometry instanceof Polygon) {
		return { message, icon: 'mdiVectorPolygon' };
	}

	return null;
});
</script>

<template>
	<div class="map-status-bar">
		<div v-if="isCapturing" class="map-status-container">
			<div class="map-status">
				<ProgressSpinner class="map-status-spinner" stroke-width="5px" />
				<!-- TODO: translations -->
				<span>Capturing location...</span>
			</div>
		</div>

		<div v-else-if="savedFeatureStatus" class="map-status-container">
			<div v-if="selectedVertexInfo.length" class="map-status">
				<IconSVG name="mdiVectorPoint" />
				<span>{{ selectedVertexInfo }}</span>
			</div>
			<div v-else class="map-status">
				<IconSVG :name="savedFeatureStatus.icon" :variant="savedFeatureStatus.highlight ? 'success' : 'base'" />
				<span>{{ savedFeatureStatus.message }}</span>
			</div>
			<Button v-if="canRemove" outlined severity="contrast" @click="emit('discard')">
				<span>–</span>
				<!-- TODO: translations -->
				<span class="mobile-only">Remove</span>
				<span class="desktop-only">Remove point</span>
			</Button>
			<Button v-if="canViewDetails" outlined severity="contrast" @click="emit('view-details')">
				<!-- TODO: translations -->
				<span>View details</span>
			</Button>
		</div>

		<div v-else class="map-status-container">
			<div class="map-status">
				<IconSVG name="mdiMapMarkerOutline" />
				<!-- TODO: translations -->
				<span>No point saved</span>
			</div>
			<Button v-if="canSave" @click="emit('save')">
				<IconSVG name="mdiCheckboxMarkedCircleOutline" size="sm" variant="inverted" />
				<!-- TODO: translations -->
				<span class="mobile-only">Save</span>
				<span class="desktop-only">Save point</span>
			</Button>
		</div>
	</div>
</template>

<style scoped lang="scss">
.map-status-bar,
.map-status-container,
.map-status {
	display: flex;
	align-items: center;
	flex-wrap: nowrap;
}

.map-status-bar {
	padding: 10px 17px;
	min-height: 60px;
	background: var(--odk-light-background-color);
}

.map-status {
	gap: 10px;
}

.map-status-container {
	justify-content: space-between;
	width: 100%;
}

.map-status-bar :deep(.p-button).p-button-contrast.p-button-outlined {
	background: var(--odk-base-background-color);
	-webkit-tap-highlight-color: transparent;
	flex-shrink: 0;

	&:hover {
		background: var(--odk-muted-background-color);
	}
}

.map-status-spinner {
	width: 20px;
	height: 20px;
}
</style>
