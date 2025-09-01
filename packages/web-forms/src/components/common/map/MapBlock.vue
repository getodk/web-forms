<script setup lang="ts">
/**
 * IMPORTANT: Lazy-loaded for OpenLayers isolation.
 * Keep OpenLayers imports/code here only to bundle separately and
 * load on demand. Avoids main bundle bloat.
 */
import IconSVG from '@/components/common/IconSVG.vue';
import {
	type GeoJSONInput,
	type GeometryType,
	type MapConfig,
	useMapBlock,
} from '@/components/common/map/useMapBlock.ts';
import Feature from 'ol/Feature';
import { Point } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import { onMounted, ref, watch } from 'vue';

// ToDo: document these props, maybe change "data" for a better name
interface MapBlockProps {
	data: GeoJSONInput;
	config: MapConfig;
}

const props = defineProps<MapBlockProps>();
const mapContainer = ref<HTMLElement | undefined>();
const isFullScreen = ref(false);
const savedFeature = ref<Feature<GeometryType> | undefined>();

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

const centerFeatureLocation = () => {
	savedFeature.value = new Feature({
		geometry: new Point(fromLonLat([-74.0059, 40.7128])), // Hardcoded: New York
	});
	if (savedFeature.value == null || mapHandler == null) {
		return;
	}

	mapHandler.centerFeatureLocation(savedFeature.value);
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

		<div v-if="mapHandler?.errorMessage.value?.length" class="map-block-error">
			<!-- TODO: translations -->
			<strong>Cannot access location</strong>&nbsp;<span>Grant location permission in the browser settings and make sure location is turned on.</span>
		</div>

		<div v-if="Object.keys(mapHandler?.selectedFeatureProperties.value).length" class="map-block-properties">
			<pre>{{ JSON.stringify(mapHandler?.selectedFeatureProperties.value) }}</pre>
		</div>
	</div>
</template>

<style scoped lang="scss">
.map-block-component {
	width: 100%;
	height: var(--odk-map-height);
	background: var(--odk-light-background-color);

	.map-block {
		width: 100%;
		height: 100%;
	}

	&.map-full-screen {
		position: absolute;
		top: 0;
		left: 0;
		height: 100vh;
		width: 100vw;
		z-index: var(--odk-z-index-overlay);
	}
}
</style>
