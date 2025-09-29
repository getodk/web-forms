<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import Button from 'primevue/button';
import { defineEmits, defineProps } from 'vue';

defineProps<{
	reservedProps: Record<string, string>;
	orderedProps: Array<[string, string]>;
	hasSavedFeature: boolean;
	disabled: boolean;
}>();

const emit = defineEmits(['close', 'save', 'discard']);
</script>

<template>
	<div class="map-properties">
		<div class="map-properties-header">
			<strong>{{ reservedProps.label ?? reservedProps.geometry }}</strong>
			<button class="close-icon" @click="emit('close')">
				<IconSVG name="mdiClose" />
			</button>
		</div>

		<div class="map-properties-content">
			<div v-for="[key = '', value = ''] in orderedProps" :key="key" class="property-line">
				{{ key }}: {{ value }}
			</div>
		</div>

		<div class="map-properties-footer">
			<Button v-if="hasSavedFeature && !disabled" outlined severity="contrast" @click="emit('discard')">
				<span>–</span>
				<!-- TODO: translations -->
				<span>Remove selection</span>
			</Button>
			<Button v-if="!hasSavedFeature && !disabled" @click="emit('save')">
				<IconSVG name="mdiCheck" size="sm" variant="inverted" />
				<!-- TODO: translations -->
				<span>Save selected</span>
			</Button>
		</div>
	</div>
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;

.map-properties {
	--odk-map-properties-spacing-lg: 20px;
	--odk-map-properties-spacing-md: 10px;
}

.map-properties {
	background: var(--odk-base-background-color);
	position: absolute;
	top: var(--odk-map-properties-spacing-md);
	left: var(--odk-map-properties-spacing-md);
	padding: var(--odk-map-properties-spacing-lg) var(--odk-map-properties-spacing-md);
	border: 1px solid var(--odk-border-color);
	border-radius: var(--odk-radius);
	display: flex;
	flex-direction: column;
	gap: var(--odk-map-properties-spacing-md);
	min-width: 300px;
	max-width: 360px;
	max-height: 370px;
	box-shadow: 1px 2px 3px 0px rgba(0, 0, 0, 0.2);
}

.map-properties-header {
	display: flex;
	flex-direction: row;
	flex-wrap: nowrap;
	justify-content: space-between;
	align-items: flex-start;
	gap: var(--odk-map-properties-spacing-md);
	padding: 0;

	strong {
		font-size: var(--odk-dialog-title-font-size);
	}

	.close-icon {
		cursor: pointer;
		margin-top: -15px;
		padding: 5px 0;
		margin-right: -3px;
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
	-webkit-tap-highlight-color: transparent;

	&:hover {
		background: var(--odk-muted-background-color);
	}
}

@media screen and (max-width: #{pf.$sm}) {
	.map-properties {
		top: unset;
		bottom: 70px;
		left: 0;
		right: 0;
		margin: 0 auto;
		max-width: calc(100% - var(--odk-map-properties-spacing-md));
		max-height: 50%;
	}
}
</style>
