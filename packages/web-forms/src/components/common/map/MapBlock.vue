<script setup lang="ts">
/**
 * IMPORTANT: Lazy-loaded for OpenLayers isolation.
 * Keep OpenLayers imports/code here only to bundle separately and
 * load on demand. Avoids main bundle bloat.
 */
import { Map, View } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import GeoJSON from 'ol/format/GeoJSON';
import TileLayer from 'ol/layer/Tile';
import { OSM } from 'ol/source';
import { onMounted, ref } from 'vue';

// ToDo: document these props
interface MapBlockProps {
	data: GeoJSON;
	config: {
		viewCoordinates: Coordinate;
		zoom?: number; // Default 10.
	};
}
const props = defineProps<MapBlockProps>();

const mapContainer = ref<HTMLElement | null>(null);

onMounted(() => {
	if (!mapContainer.value) {
		return;
	}

	const { viewCoordinates, zoom = 10 } = props.config;

	const mapRef = new Map({
		target: mapContainer.value,
		layers: [new TileLayer({ source: new OSM() })], // ToDo: what's the default, and how can fd configure it
		view: new View({ center: viewCoordinates, zoom }),
	});
});
</script>

<template>
	<div ref="mapContainer" class="map-block" />
</template>

<style scoped lang="scss">
.map-block {
	width: 100%;
	height: var(--odk-map-height);
}
</style>
