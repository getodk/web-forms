<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import {
	DRAW_FEATURE_TYPES,
	type DrawFeatureType,
} from '@/components/common/map/useMapInteractions.ts';
import { getFlatCoordinates } from '@/components/common/map/vertex-geometry.ts';
import type { Coordinate } from 'ol/coordinate';
import type Feature from 'ol/Feature';
import { LineString, Point, Polygon } from 'ol/geom';
import { toLonLat } from 'ol/proj';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import { computed } from 'vue';

interface StatusDetails {
	message: string;
	icon: string;
	highlight?: boolean;
}

const props = defineProps<{
	savedFeature: Feature | undefined;
	selectedVertex: Coordinate | undefined;
	drawFeatureType?: DrawFeatureType;
	isCapturing: boolean;
	canRemove: boolean;
	canSave: boolean;
	canViewDetails: boolean;
}>();
const emit = defineEmits(['view-details', 'save', 'discard']);

const noSavedStatus = computed<StatusDetails>(() => {
	// TODO: translations
	if (props.drawFeatureType === DRAW_FEATURE_TYPES.TRACE) {
		return { message: 'No trace saved', icon: 'mdiVectorPolyline' };
	}

	if (props.drawFeatureType === DRAW_FEATURE_TYPES.SHAPE) {
		return { message: 'No shape saved', icon: 'mdiVectorPolygon' };
	}

	return { message: 'No point saved', icon: 'mdiMapMarkerOutline' };
});

const selectedVertexInfo = computed(() => {
	if (!props.selectedVertex || props.selectedVertex.length < 2) {
		return '';
	}

	// ToDo: Is accuracy needed?
	const [longitude, latitude, altitude] = toLonLat(props.selectedVertex);
	const parts = [`Longitude: ${longitude}`, `Latitude: ${latitude}`];

	if (altitude !== undefined) {
		parts.push(`Altitude: ${altitude} m`);
	}

	return parts.join(', ');
});

const savedStatus = computed<StatusDetails | null>(() => {
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

		<div v-else-if="savedStatus" class="map-status-container">
			<div v-if="selectedVertexInfo.length" class="map-status">
				<span class="vertex-status">{{ selectedVertexInfo }}</span>
			</div>
			<div v-else class="map-status">
				<IconSVG
					:name="savedStatus.icon"
					:variant="savedStatus.highlight ? 'success' : 'base'"
				/>
				<span>{{ savedStatus.message }}</span>
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
				<IconSVG :name="noSavedStatus.icon" />
				<!-- TODO: translations -->
				<span>{{ noSavedStatus.message }}</span>
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

.vertex-status {
	&:before {
		content: '';
		display: inline-block;
		height: 17px;
		width: 17px;
		border: 2px solid var(--p-surface-900);
		vertical-align: middle;
		margin-right: 13px;
	}
}
</style>
