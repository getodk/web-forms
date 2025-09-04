<script setup lang="ts">
/**
 * IMPORTANT: Lazy-loaded for OpenLayers isolation.
 * Keep OpenLayers imports/code here only to bundle separately and
 * load on demand. Avoids main bundle bloat.
 */
import IconSVG from '@/components/common/IconSVG.vue';
import MapProperties from '@/components/common/map/MapProperties.vue';
import MapStatusBar from '@/components/common/map/MapStatusBar.vue';
import {
	type GeoJSONInput,
	type MapConfig,
	useMapBlock,
} from '@/components/common/map/useMapBlock.ts';
import { computed, onMounted, ref, watch } from 'vue';

// ToDo: document these props, maybe change "data" for a better name
interface MapBlockProps {
	data: GeoJSONInput;
	config: MapConfig;
}

const props = defineProps<MapBlockProps>();
const emit = defineEmits(['save']);
const mapContainer = ref<HTMLElement | undefined>();
const isFullScreen = ref(false);

const mapHandler = useMapBlock(props.config);

onMounted(() => {
	if (mapContainer.value == null || mapHandler == null) {
		return;
	}

	mapHandler.initializeMap(mapContainer.value);
	mapHandler.loadGeometries(props.data);
});

watch(
	() => props.data,
	(newData) => {
		mapHandler?.loadGeometries(newData);
	},
	{ deep: true, immediate: true }
);

const mapPropertiesTitle = computed(() => {
	// ToDo: use correct labels
	const label = mapHandler?.selectedFeatureProperties.value?.label;
	return typeof label === 'string' ? label : '';
});

const centerFeatureLocation = () => {
	if (mapHandler.savedFeature.value != null) {
		mapHandler.centerFeatureLocation(mapHandler.savedFeature.value);
	}
};

const saveSelection = () => {
	mapHandler?.saveFeature();
	emit('save', mapHandler.savedFeature.value);
};
</script>

<template>
	<div :class="{ 'map-block-component': true, 'map-full-screen': isFullScreen }">
		<div class="control-bar">
			<button :class="{ 'control-active': isFullScreen }" @click="isFullScreen = !isFullScreen">
				<IconSVG name="mdiArrowExpandAll" />
			</button>
			<button @click="centerFeatureLocation">
				<IconSVG name="mdiFullscreen" />
			</button>
			<button @click="mapHandler?.centerCurrentLocation">
				<IconSVG name="mdiCrosshairsGps" />
			</button>
		</div>

		<div ref="mapContainer" class="map-block" />

		<MapStatusBar
			:has-saved-feature="mapHandler?.savedFeature.value != null"
			class="map-status-bar-component"
			@view-details="mapHandler?.selectFeature(mapHandler?.savedFeature.value)"
		/>

		<div v-if="mapHandler?.errorMessage.value != null" class="map-block-error">
			<strong>{{ mapHandler?.errorMessage.value.title }}</strong>
			&nbsp;
			<span>{{ mapHandler?.errorMessage.value.message }}</span>
		</div>

		<MapProperties
			v-if="mapHandler?.selectedFeatureProperties.value != null"
			:title="mapPropertiesTitle"
			:properties="mapHandler?.selectedFeatureProperties.value"
			:has-saved-feature="mapHandler?.isSelectedFeatureSaved()"
			@close="mapHandler.unselectFeature"
			@discard="mapHandler?.discardSavedFeature"
			@save="saveSelection"
		/>
	</div>
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;

.map-block-component {
	--odk-standard-map-spacing: 20px;
}

.map-block-component {
	position: relative;
	width: 100%;
	height: fit-content;
	background: var(--odk-base-background-color);
	border-radius: var(--odk-radius) var(--odk-radius) 0 0;
	overflow: hidden;

	.map-block {
		width: 100%;
		height: 445px;
	}

	&.map-full-screen {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		position: absolute;
		top: 0;
		left: 0;
		height: 100vh;
		width: 100vw;
		z-index: var(--odk-z-index-topmost);

		.map-block {
			flex-grow: 2;
		}
	}
}

.control-bar {
	position: absolute;
	display: flex;
	flex-direction: column;
	top: var(--odk-standard-map-spacing);
	right: var(--odk-standard-map-spacing);
	z-index: var(--odk-z-index-overlay);
	gap: 10px;

	button {
		background: var(--odk-base-background-color);
		padding: 8px;
		border-radius: var(--odk-radius);
		border: 1px solid var(--odk-border-color);
		cursor: pointer;

		&:hover {
			background: var(--odk-muted-background-color);
		}
	}
}

.map-block-component :deep(.ol-zoom) {
	position: absolute;
	right: var(--odk-standard-map-spacing);
	bottom: var(--odk-standard-map-spacing);
	display: flex;
	flex-direction: column;
	flex-wrap: nowrap;
	align-items: center;
	box-shadow: none;
	background: var(--odk-base-background-color);
	border-radius: var(--odk-radius);
	overflow: hidden;
	border: 1px solid var(--odk-border-color);

	button,
	button:hover,
	button:focus,
	button:active {
		height: 37px;
		width: 36px;
		border: none;
		border-bottom: 1px solid var(--odk-border-color);
		background: var(--odk-base-background-color);
		font-size: 24px;
		font-weight: 300;
		cursor: pointer;

		&:hover {
			background: var(--odk-muted-background-color);
		}
	}
}

.map-block-error {
	font-size: var(--odk-base-font-size);
	color: var(--odk-error-text-color);
	background-color: var(--odk-error-background-color);
	border-radius: var(--odk-radius);
	margin-top: var(--odk-standard-map-spacing);
	padding: var(--odk-standard-map-spacing);
}

@media screen and (max-width: #{pf.$sm}) {
	.map-block-component,
	.map-block-component .map-block {
		height: 100vh;

		:deep(.ol-zoom) {
			top: 165px;
			bottom: unset;
		}
	}

	.map-status-bar-component {
		display: none;
	}
}
</style>
