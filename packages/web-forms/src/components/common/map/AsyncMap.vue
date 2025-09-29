<script setup lang="ts">
/**
 * IMPORTANT: OpenLayers and MapBlock are not statically imported here to enable bundling them into a separate chunk.
 * This prevents unnecessary bloat in the main application bundle, reducing initial load times and improving performance.
 * Use dynamic imports instead (e.g., `await import(importPath)`) for lazy-loading these dependencies only when required.
 */
import type { SelectItem } from '@getodk/xforms-engine';
import ProgressSpinner from 'primevue/progressspinner';
import { computed, type DefineComponent, onMounted, shallowRef, ref } from 'vue';

type Coordinates = [longitude: number, latitude: number];
type GeometryType = 'LineString' | 'Point' | 'Polygon';

interface Feature {
	type: 'Feature';
	geometry: { type: GeometryType; coordinates: Coordinates | Coordinates[] | Coordinates[][] };
	properties: Record<string, unknown>;
}

type MapBlockComponent = DefineComponent<{
	featureCollection: { type: string; features: Feature[] };
	disabled: boolean;
	orderedExtraProps: Map<string, Array<[string, string]>>;
	savedFeatureValue: string | undefined;
}>;

interface AsyncMapProps {
	// ToDo: Expand typing when implementing Geo Point/Shape/Trace question types.
	features: readonly SelectItem[];
	disabled: boolean;
	savedFeatureValue: string | undefined;
}

const props = defineProps<AsyncMapProps>();
const emit = defineEmits(['save']);

const STATES = {
	READY: 'ready',
	LOADING: 'loading',
	ERROR: 'error',
} as const;

const ODK_PROPERTY_PREFIX = 'odk_'; // Avoids conflicts with OpenLayers (for example, geometry).
const RESERVED_MAP_PROPERTIES = [
	'itextId',
	'geometry',
	'marker-color',
	'marker-symbol',
	'stroke',
	'stroke-width',
	'fill',
];

const mapComponent = shallowRef<MapBlockComponent | null>(null);
const currentState = shallowRef<(typeof STATES)[keyof typeof STATES]>(STATES.LOADING);

const orderedExtraPropsMap = ref<Map<string, Array<[string, string]>>>(new Map());
const featureCollection = computed(() => {
	orderedExtraPropsMap.value.clear();
	const features: Feature[] = [];

	props.features?.forEach((option) => {
		try {
			const reservedProps: Record<string, string> = {
				[ODK_PROPERTY_PREFIX + 'label']: option.label?.asString,
				[ODK_PROPERTY_PREFIX + 'value']: option.value,
			};
			const orderedProps: Array<[string, string]> = [];

			option.properties.forEach(([key, value]) => {
				if (RESERVED_MAP_PROPERTIES.includes(key)) {
					reservedProps[ODK_PROPERTY_PREFIX + key] = value;
				} else {
					orderedProps.push([key, value]);
				}
			});

			orderedExtraPropsMap.value.set(option.value, orderedProps);
			const geometry = reservedProps[ODK_PROPERTY_PREFIX + 'geometry'];
			if (!geometry) {
				throw new Error('Missing geometry');
			}

			const coordinates = getGeoJSONCoordinates(geometry);
			if (coordinates.length === 0) {
				throw new Error('Missing geo points');
			}

			const type = getGeometryType(coordinates);
			features.push({
				type: 'Feature',
				geometry: { type, coordinates: formatCoordsPerType(type, coordinates) },
				properties: reservedProps,
			});
		} catch {
			// Skip invalid options silently to match Collect behaviour.
		}
	});

	return { type: 'FeatureCollection', features };
});

const getGeometryType = (coords: Array<[number, number]>): GeometryType => {
	if (coords.length === 1) {
		return 'Point';
	}

	const first = coords[0];
	const last = coords[coords.length - 1];
	return first[0] === last[0] && first[1] === last[1] ? 'Polygon' : 'LineString';
};

const getGeoJSONCoordinates = (geometry: string): Array<[number, number]> => {
	return geometry.split(';').map((coord) => {
		const [lat, lon] = coord.trim().split(/\s+/).map(Number);

		const isNullLocation = lat === 0 && lon === 0;
		const isValidLatitude = lat != null && !Number.isNaN(lat) && Math.abs(lat) <= 90;
		const isValidLongitude = lon != null && !Number.isNaN(lon) && Math.abs(lon) <= 180;

		if (isNullLocation || !isValidLatitude || !isValidLongitude) {
			throw new Error('Invalid geo point coordinates');
		}

		return [lon, lat];
	});
};

const formatCoordsPerType = (type: GeometryType, coords: Array<[number, number]>) => {
	if (type === 'Point') {
		return coords[0];
	}

	if (type === 'Polygon') {
		return [coords];
	}

	return coords;
};

const loadMap = async () => {
	currentState.value = STATES.LOADING;

	try {
		/**
		 * TODO: Implement retry mechanism for when the bundle fails to download.
		 *       Adding a cache bust parameter doesn't work in Central.
		 */
		mapComponent.value = (
			(await import('./MapBlock.vue')) as {
				default: MapBlockComponent;
			}
		).default;
		currentState.value = STATES.READY;
	} catch {
		currentState.value = STATES.ERROR;
	}
};

const save = (feature: Feature) => emit('save', feature);

onMounted(loadMap);
</script>

<template>
	<div class="async-map-container">
		<div v-if="currentState === STATES.ERROR" class="map-error">
			<!-- TODO: translations -->
			<p class="map-error-message">Unable to load map</p>

			<!-- TODO: Uncomment once retry mechanism is implemented.
				<Button outlined severity="contrast" class="retry-button" @click="loadMap">
				<IconSVG name="mdiRefresh" />
				// TODO: translations
				<span>Try again</span>
				</Button>
			-->
		</div>

		<ProgressSpinner v-else-if="currentState === STATES.LOADING" class="map-spinner" />

		<component
			:is="mapComponent"
			v-else
			:feature-collection="featureCollection"
			:ordered-extra-props="orderedExtraPropsMap"
			:saved-feature-value="savedFeatureValue"
			:disabled="disabled"
			@save="save"
		/>
	</div>
</template>

<style scoped lang="scss">
.async-map-container {
	display: flex;
	align-items: center;
	justify-content: center;
	height: fit-content;
	width: 100%;
	min-height: 445px;
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
