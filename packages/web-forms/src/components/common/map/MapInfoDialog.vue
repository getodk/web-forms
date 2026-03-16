<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

defineProps<{
	actionsInfo: Array<{
		readonly icon: string;
		readonly description: string;
		infoClasses?: string[];
	}>;
	visible: boolean;
}>();

const emit = defineEmits(['update:visible']);
</script>

<template>
	<Dialog
		:visible="visible"
		modal
		class="map-info-dialog"
		:draggable="false"
		@update:visible="emit('update:visible', $event)"
	>
		<template #header>
			<!-- TODO: translations -->
			<strong>How to use the map?</strong>
		</template>

		<template #default>
			<ul class="map-info-dialog-list">
				<li v-for="(action, index) in actionsInfo" :key="index" :class="action.infoClasses?.join(' ')">
					<div class="map-info-description">
						<IconSVG :name="action.icon" />
						<span>{{ action.description }}</span>
					</div>
				</li>
			</ul>
		</template>

		<template #footer>
			<!-- TODO: translations -->
			<Button label="Done" @click="emit('update:visible', false)" />
		</template>
	</Dialog>
</template>

<style scoped lang="scss">
.map-info-dialog-list {
	margin: 0;
	padding: 0;
	list-style: none;

	li {
		padding: var(--odk-spacing-xl) 0;
		border-bottom: 1px solid var(--odk-border-color);

		&:first-child {
			padding-top: 0;
		}

		&:last-child {
			border-bottom: none;
		}

		.map-info-description {
			display: flex;
			align-items: center;
			gap: var(--odk-spacing-xl);
		}
	}
}
</style>
