<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import Button from 'primevue/button';

export interface UploadControlPreviewProps {
	readonly fileName: string;
}

defineProps<UploadControlPreviewProps>();
defineEmits(['clear']);
</script>

<template>
	<div class="file-preview-content">
		<span>{{ fileName }}</span>
		<Button severity="secondary" @click="$emit('clear')">
			<IconSVG name="mdiClose" variant="muted" size="sm" />
		</Button>
	</div>
</template>

<style scoped lang="scss">
.file-preview-content {
	display: flex;
	align-items: center;
	gap: var(--odk-spacing-xxl);
}
</style>
