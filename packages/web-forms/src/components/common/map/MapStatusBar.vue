<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import Button from 'primevue/button';

defineProps<{ hasSavedFeature: boolean }>();
const emit = defineEmits(['view-details']);
</script>

<template>
	<div class="map-status-bar">
		<div v-if="hasSavedFeature" class="map-status-wrap">
			<div class="map-status">
				<IconSVG name="mdiCheck" />
				<!-- TODO: translations -->
				<span>Point saved</span>
			</div>
			<Button outlined severity="contrast" @click="emit('view-details')">
				<!-- TODO: translations -->
				<span>View details</span>
			</Button>
		</div>

		<div v-else class="map-status">
			<IconSVG name="mdiCrosshairsGps" />
			<!-- TODO: translations -->
			<span>No point saved</span>
		</div>
	</div>
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;

.map-status-bar,
.map-status,
.map-status-wrap {
	display: flex;
	align-items: center;
	flex-wrap: nowrap;
}

.map-status-bar {
	padding: 10px 20px;
	min-height: 60px;
	background: var(--odk-light-background-color);
	border: 1px solid var(--odk-border-color);
}

.map-status {
	gap: 10px;
}

.map-status-wrap {
	justify-content: space-between;
	width: 100%;
}

.map-status-bar :deep(.p-button).p-button-contrast.p-button-outlined {
	background: var(--odk-base-background-color);

	&:hover {
		background: var(--odk-muted-background-color);
	}
}
</style>
