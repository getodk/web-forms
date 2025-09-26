<script lang="ts" setup>
import ColumnarAppearance from '@/components/appearances/ColumnarAppearance.vue';
import FieldListTable from '@/components/appearances/FieldListTable.vue';
import UnsupportedAppearance from '@/components/appearances/UnsupportedAppearance.vue';
import AsyncMap, {
	type Feature,
	type FeatureCollection,
} from '@/components/common/map/AsyncMap.vue';
import ControlText from '@/components/form-elements/ControlText.vue';
import ValidationMessage from '@/components/common/ValidationMessage.vue';
import LikertWidget from '@/components/common/LikertWidget.vue';
import RadioButton from '@/components/common/RadioButton.vue';
import SearchableDropdown from '@/components/common/SearchableDropdown.vue';
import type { SelectItem, SelectNode } from '@getodk/xforms-engine';
import { computed, ref, watchEffect } from 'vue';

const RESERVED_MAP_PROPERTIES = [
	'itextId',
	'geometry',
	'marker-color',
	'marker-symbol',
	'stroke',
	'stroke-width',
	'fill',
];

interface Select1ControlProps {
	readonly question: SelectNode;
}

const props = defineProps<Select1ControlProps>();
const isSelectWithImages = computed(() => props.question.currentState.isSelectWithImages);
const hasColumnsAppearance = ref(false);
const hasFieldListRelatedAppearance = ref(false);
const hasMapAppearance = ref(false);

watchEffect(() => {
	const appearances = [...props.question.appearances];
	hasMapAppearance.value = appearances.includes('map');

	hasFieldListRelatedAppearance.value = appearances.some((appearance) => {
		return ['label', 'list-nolabel', 'list'].includes(appearance);
	});

	if (appearances.length === 0 && isSelectWithImages.value) {
		hasColumnsAppearance.value = true;
	} else {
		hasColumnsAppearance.value = appearances.some((appearance) => appearance.startsWith('columns'));
	}
});

const featureCollection = computed(() => {
	if (!hasMapAppearance.value) {
		return;
	}

	const features: Feature[] = [];
	props.question.currentState.valueOptions.forEach((option: SelectItem) => {
		try {
			const reservedProps: Record<string, string> = {
				label: option.label?.asString,
				value: option.value,
			};
			const orderedProps: Array<[string, string]> = [];

			option.properties.forEach(([key, value]) => {
				if (RESERVED_MAP_PROPERTIES.includes(key)) {
					reservedProps[key] = value;
				} else {
					orderedProps.push([key, value]);
				}
			});

			if (!reservedProps.geometry) {
				throw new Error('Missing geometry');
			}

			const coordinates = getGeoJSONCoordinates(reservedProps.geometry);
			if (coordinates.length === 0) {
				throw new Error('Missing geo points');
			}

			const geometryType = getGeometryType(coordinates);
			features.push({
				type: 'Feature',
				geometry: {
					type: geometryType,
					coordinates: geometryType === 'Point' ? coordinates[0] : coordinates,
				},
				properties: { reservedProps, orderedProps },
			});
		} catch {
			// Skip invalid options silently to match Collect behaviour.
		}
	});

	return { type: 'FeatureCollection', features };
});

const viewCoordinates = computed(() => {
	if (!hasMapAppearance.value || !props.question.currentState.value?.length) {
		return;
	}

	const coordinates = getGeoJSONCoordinates(props.question.currentState.value[0]);
	return coordinates.length ? coordinates[0] : undefined;
});

const getGeometryType = (coords: Array<[number, number]>): 'Point' | 'LineString' | 'Polygon' => {
	if (coords.length === 1) {
		return 'Point';
	}
	const first = coords[0];
	const last = coords[coords.length - 1];
	return first[0] === last[0] && first[1] === last[1] ? 'Polygon' : 'LineString';
};

const getGeoJSONCoordinates = (geometry: string): Array<[number, number]> => {
	return geometry.split(',').map((coord) => {
		const [lat, lon] = coord.split(/\s+/).map(Number);

		const isNullLocation = lat === 0 && lon === 0;
		const isValidLatitude = lat != null && !Number.isNaN(lat) && Math.abs(lat) <= 90;
		const isValidLongitude = lon != null && !Number.isNaN(lon) && Math.abs(lon) <= 180;
		if (isNullLocation || !isValidLatitude || !isValidLongitude) {
			throw new Error('Invalid geo point coordinates');
		}

		return [lon, lat];
	});
};
</script>

<template>
	<ControlText v-if="!hasFieldListRelatedAppearance" :question="question" />

	<SearchableDropdown
		v-if="question.appearances.autocomplete || question.appearances.minimal"
		:question="question"
	/>

	<LikertWidget
		v-else-if="question.appearances.likert"
		:class="{ 'select-with-images': isSelectWithImages }"
		:question="question"
	/>

	<AsyncMap
		v-else-if="hasMapAppearance && featureCollection"
		:feature-collection="featureCollection"
		:config="{ viewCoordinates }"
		@save
	/>

	<FieldListTable
		v-else-if="hasFieldListRelatedAppearance"
		:class="{ 'select-with-images': isSelectWithImages }"
		:appearances="question.appearances"
	>
		<template #firstColumn>
			<ControlText :question="question" />
		</template>
		<template #default>
			<RadioButton :question="question" />
		</template>
	</FieldListTable>

	<ColumnarAppearance
		v-else-if="hasColumnsAppearance"
		:class="{ 'select-with-images': isSelectWithImages }"
		:appearances="question.appearances"
	>
		<RadioButton :question="question" />
	</ColumnarAppearance>

	<template v-else>
		<template v-if="question.appearances['image-map']">
			<UnsupportedAppearance
				:appearance="[...question.appearances].toString()"
				node-type="Select1"
			/>
		</template>
		<div class="default-appearance">
			<RadioButton :question="question" />
		</div>
	</template>

	<ValidationMessage
		:message="question.validationState.violation?.message.asString"
		:add-placeholder="!hasFieldListRelatedAppearance"
	/>
</template>

<style lang="scss" scoped>
@use 'primeflex/core/_variables.scss' as pf;
.default-appearance {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 0.8rem;

	@media screen and (min-width: #{pf.$md}) {
		min-width: 50%;
		width: max-content;
		max-width: 100%;
	}
}
</style>
