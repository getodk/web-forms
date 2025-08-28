<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';

/**
 * Note: OpenLayers and MapBlock are not statically imported here to enable bundling them into a separate chunk.
 * This prevents unnecessary bloat in the main application bundle, reducing initial load times and improving performance.
 * Use dynamic imports instead (e.g., `await import(importPath)`) for lazy-loading these dependencies only when required.
 */
import { type DefineComponent, onMounted, ref, shallowRef } from 'vue';

interface GeoJSON {
	type: 'LineString' | 'Point' | 'Polygon';
	properties?: Record<string, unknown> | null;
	geometry?: Geometry | null;
	features?: Feature[];
}

interface Geometry {
	type: 'LineString' | 'Point' | 'Polygon';
	coordinates: number[] | number[][];
}

interface Feature {
	type: 'Feature';
	geometry: Geometry | null;
	properties: Record<string, unknown> | null;
}

interface MapBlockProps {
	data: GeoJSON[];
	config: {
		viewCoordinates: [number, number];
		zoom?: number;
	};
}

type MapBlockComponent = DefineComponent<MapBlockProps>;

defineProps<MapBlockProps>();

const mapComponent = shallowRef<MapBlockComponent | null>(null);
const loading = ref(true);
const error = ref(false);
const cacheBustCounter = ref(0);
const TIMEOUT_MS = 5 * 1000;

const loadMap = async () => {
	error.value = false;
	loading.value = true;
	cacheBustCounter.value++;

	const timeoutId = setTimeout(() => {
		throw new Error('Download of Map bundle timeout');
	}, TIMEOUT_MS);

	try {
		const importPath = `./MapBlock.vue?bust=${cacheBustCounter.value}`;
		mapComponent.value = ((await import(importPath)) as { default: MapBlockComponent }).default;
	} catch {
		error.value = true;
	} finally {
		clearTimeout(timeoutId);
		loading.value = false;
	}
};

onMounted(loadMap);
</script>

<template>
	<div class="async-map-container">
		<div v-if="error" class="map-error">
			<!-- TODO: translations -->
			<p class="map-error-message">Unable to load map</p>
			<Button outlined severity="contrast" class="retry-button" @click="loadMap">
				<IconSVG name="mdiRefresh" />
				<!-- TODO: translations -->
				<span>Try again</span>
			</Button>
		</div>
		<ProgressSpinner v-else-if="loading" class="map-spinner" />
		<component :is="mapComponent" v-else v-bind="{ ...$props, ...$attrs }" />
	</div>
</template>

<style scoped lang="scss">
.async-map-container {
	display: flex;
	align-items: center;
	justify-content: center;
	height: var(--odk-map-height);
	width: 100%;
	background: var(--odk-light-background-color);
	border-radius: var(--odk-radius);
	color: var(--odk-text-color);
}

.map-error {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 40px;
}

.map-error-message {
	font-size: var(--odk-sub-group-font-size);
	font-weight: 600;
	margin: 0;
}

.map-spinner {
	width: 70px;
	height: 70px;
}

.p-button.p-button-contrast.p-button-outlined.retry-button {
	background: var(--odk-base-background-color);

	&:hover {
		background: var(--odk-muted-background-color);
	}
}
</style>
