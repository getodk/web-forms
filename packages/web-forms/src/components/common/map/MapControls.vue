<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import MapInfoDialog from '@/components/common/map/MapInfoDialog.vue';
import { ref } from 'vue';

defineProps<{
	isFullScreen: boolean;
	disableFitAllFeatures: boolean;
	disableUndo: boolean;
	disableDelete: boolean;
	showSecondaryControls: boolean;
}>();

const emit = defineEmits([
	'toggleFullScreen',
	'fitAllFeatures',
	'watchCurrentLocation',
	'triggerDelete',
	'undoLastChange',
]);

const showActionsInfo = ref(false);
const MAP_ACTIONS = {
	openFullScreen: {
		icon: 'mdiArrowExpand',
		description: 'Expands to full screen',
	},
	closeFullScreen: {
		icon: 'mdiArrowCollapse',
		description: 'Exit full screen',
	},
	zoomFitAll: {
		icon: 'mdiFullscreen',
		description: 'Show all features on the map',
	},
	currentLocation: {
		icon: 'mdiCrosshairsGps',
		description: 'Find your location',
	},
	undo: {
		icon: 'mdiArrowULeftTop',
		description: 'Undo last action',
	},
	delete: {
		icon: 'mdiTrashCanOutline',
		description: 'Delete one vertex or all vertices',
	},
	advanced: {
		icon: 'mdiCogOutline',
		infoClasses: ['mobile-only'],
		description: 'Advanced manual edits',
	},
} as const;
const MAP_ACTIONS_ARRAY = Object.values(MAP_ACTIONS);
</script>

<template>
	<div class="control-bar" :class="{ 'full-screen-active': isFullScreen }">
		<div class="control-bar-vertical">
			<button @click="emit('toggleFullScreen')">
				<IconSVG v-if="isFullScreen" :name="MAP_ACTIONS.closeFullScreen.icon" />
				<IconSVG v-else :name="MAP_ACTIONS.openFullScreen.icon" />
			</button>
			<button class="zoom-fit-all" :disabled="disableFitAllFeatures" @click="emit('fitAllFeatures')">
				<IconSVG :name="MAP_ACTIONS.zoomFitAll.icon" />
			</button>
			<button class="zoom-current-location" @click="emit('watchCurrentLocation')">
				<IconSVG :name="MAP_ACTIONS.currentLocation.icon" size="sm" />
			</button>
			<button class="info-dialog" @click="showActionsInfo = true">
				<IconSVG name="mdiInformationSlabCircleOutline" />
			</button>
		</div>

		<div v-if="showSecondaryControls" class="control-bar-horizontal">
			<button :disabled="disableDelete" @click="emit('triggerDelete')">
				<IconSVG :name="MAP_ACTIONS.delete.icon" />
			</button>
			<button :disabled="disableUndo" @click="emit('undoLastChange')">
				<IconSVG :name="MAP_ACTIONS.undo.icon" />
			</button>
		</div>
	</div>

  <MapInfoDialog :actions-info="MAP_ACTIONS_ARRAY" v-model:visible="showActionsInfo" />
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;
@use '../../../assets/styles/map-block' as mb;

.control-bar {
	button {
		@include mb.map-control-button;
	}

	.control-bar-vertical {
		@include mb.map-control-bar-vertical;
		top: var(--odk-map-controls-spacing);
	}

	.control-bar-horizontal {
		@include mb.map-control-bar;
		flex-direction: row;
		left: var(--odk-map-controls-spacing);
		bottom: var(--odk-map-controls-spacing);
		background: var(--odk-base-background-color);
		border: 1px solid var(--odk-border-color);
		border-radius: var(--odk-spacing-m);
		gap: 4px;
		padding: 7px;

		button {
			height: 48px;
			width: 48px;
			border: none;
		}
	}
}

@media screen and (max-width: #{pf.$sm}) {
	.control-bar {
		top: var(--odk-map-controls-spacing);
		right: var(--odk-map-controls-spacing);
	}

	.control-bar:not(.full-screen-active) {
		.control-bar-horizontal,
		.control-bar-vertical .info-dialog,
		.control-bar-vertical .zoom-fit-all,
		.control-bar-vertical .zoom-current-location {
			display: none;
		}
	}
}
</style>
