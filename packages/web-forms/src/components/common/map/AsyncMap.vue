<script setup lang="ts">
/**
 * IMPORTANT: OpenLayers and MapBlock are not statically imported here to enable bundling them into a separate chunk.
 * This prevents unnecessary bloat in the main application bundle, reducing initial load times and improving performance.
 * Use dynamic imports instead (e.g., `await import(importPath)`) for lazy-loading these dependencies only when required.
 */
import IconSVG from '@/components/common/IconSVG.vue';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import { type DefineComponent, onMounted, shallowRef } from 'vue';

// TODO: This type will come from xforms-engine
export interface GeoJSONInput {
	type: string;
	features?: Array<{
		type: string;
		geometry: {
			type: string;
			coordinates: unknown;
		};
		properties?: Record<string, unknown>;
	}>;
}

interface MapBlockProps {
	data: GeoJSONInput;
	config: {
		viewCoordinates: [number, number];
		zoom?: number;
	};
}

type MapBlockComponent = DefineComponent<MapBlockProps>;

defineProps<MapBlockProps>();

const TIMEOUT_MS = 5 * 1000;
const STATES = {
	READY: 'ready',
	LOADING: 'loading',
	ERROR: 'error',
} as const;

const mapComponent = shallowRef<MapBlockComponent | null>(null);
const currentState = shallowRef<(typeof STATES)[keyof typeof STATES]>(STATES.LOADING);
const cacheBustCounter = shallowRef(0);

const loadMap = async () => {
	currentState.value = STATES.LOADING;
	cacheBustCounter.value++;

	const timeoutId = setTimeout(() => {
		throw new Error('Download of Map bundle timeout');
	}, TIMEOUT_MS);

	try {
		const importPath = `./MapBlock.vue?bust=${cacheBustCounter.value}`;
		mapComponent.value = ((await import(importPath)) as { default: MapBlockComponent }).default;
		currentState.value = STATES.READY;
	} catch {
		currentState.value = STATES.ERROR;
	} finally {
		clearTimeout(timeoutId);
	}
};

onMounted(loadMap);
</script>

<template>
	<div class="async-map-container">
		<div v-if="currentState === STATES.ERROR" class="map-error">
			<!-- TODO: translations -->
			<p class="map-error-message">
				Unable to load map
			</p>
			<Button outlined severity="contrast" class="retry-button" @click="loadMap">
				<IconSVG name="mdiRefresh" />
				<!-- TODO: translations -->
				<span>Try again</span>
			</Button>
		</div>
		<ProgressSpinner v-else-if="currentState === STATES.LOADING" class="map-spinner" />
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
