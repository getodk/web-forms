<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import Button from 'primevue/button';
import { defineEmits, defineProps } from 'vue';

defineProps<{
	title: string;
	properties: Record<string, unknown>;
	hasSavedFeature: boolean;
}>();

const emit = defineEmits(['close', 'save', 'discard']);
</script>

<template>
	<div class="map-properties">
		<div class="map-properties-header">
			<IconSVG v-if="hasSavedFeature" name="mdiCheck" variant="primary"/>
			<strong>{{ title }}</strong>
			<button class="close-icon" @click="emit('close')">
				<IconSVG name="mdiClose" />
			</button>
		</div>

		<div class="map-properties-content">
			<div v-for="[key, value] in Object.entries(properties)" :key="key" class="property-line">
				{{ key }}: {{ value }}
			</div>
		</div>

		<div class="map-properties-footer">
			<Button v-if="hasSavedFeature" outlined severity="contrast" @click="emit('discard')">
				<IconSVG name="mdiPencil" />
				<!-- TODO: translations -->
				<span>Remove selection</span>
			</Button>
			<Button v-else outlined severity="contrast" @click="emit('save')">
				<IconSVG name="mdiContentSave" />
				<!-- TODO: translations -->
				<span>Save selected</span>
			</Button>
		</div>
	</div>
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;

.map-properties {
	--odk-standard-map-spacing: 20px;
}

.map-properties {
	background: var(--odk-base-background-color);
	position: absolute;
	top: var(--odk-standard-map-spacing);
	left: var(--odk-standard-map-spacing);
	padding: var(--odk-standard-map-spacing) 15px;
	border-radius: var(--odk-radius);
	display: flex;
	flex-direction: column;
	gap: 10px;
	min-width: 300px;
	max-width: 360px;
	max-height: 370px;
	box-shadow: 1px 2px 3px 0px rgba(0, 0, 0, 0.2);
}

.map-properties-header {
	padding: 10px 0px;
	display: flex;
	flex-direction: row;
	flex-wrap: nowrap;
	justify-content: space-between;
	align-items: flex-start;
	gap: 10px;

	strong {
		font-size: var(--odk-dialog-title-font-size);
	}

	.close-icon {
		cursor: pointer;
		margin-top: -15px;
	}
}

.map-properties-content {
	overflow: auto;

	.property-line {
		padding: 15px 0;

		&:not(:last-child) {
			border-bottom: 1px solid var(--odk-border-color);
		}
	}
}

.map-properties-footer :deep(.p-button).p-button-contrast.p-button-outlined {
	background: var(--odk-base-background-color);

	&:hover {
		background: var(--odk-muted-background-color);
	}
}

@media screen and (max-width: #{pf.$sm}) {
	.map-properties {
		top: unset;
		bottom: var(--odk-standard-map-spacing);
		left: 0;
		right: 0;
		margin: 0 auto;
		max-width: calc(100% - (var(--odk-standard-map-spacing) * 2));
		max-height: 50%;
	}
}
</style>
