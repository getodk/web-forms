<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import Button from 'primevue/button';

type ObjectURL = `blob:${string}`;

export interface UploadControlPreviewProps {
	readonly fileName: string;
	readonly image: ObjectURL | null;
}

defineProps<UploadControlPreviewProps>();
defineEmits(['clear']);
</script>

<template>
	<div class="file-preview-content">
		<img v-if="image" :src="image" :alt="fileName" class="upload-thumbnail">
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
	gap: 30px; // TODO replace with global variable once this is merged: https://github.com/getodk/web-forms/pull/737
}
.file-preview-content span {
	flex-grow: 2;
}
.upload-thumbnail {
	max-height: 100px;
	max-width: 100px;
	width: auto;
	height: auto;
	object-fit: contain;
	vertical-align: middle;
}
</style>
