<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import ImageBlock from '@/components/common/media/ImageBlock.vue';
import Button from 'primevue/button';

type ObjectURL = `blob:${string}`;

export interface UploadImagePreviewProps {
	readonly isDisabled: boolean;
	readonly image: ObjectURL | null;
}

defineEmits(['clear']);
defineProps<UploadImagePreviewProps>();
</script>

<template>
	<div v-if="image" class="preview-captured-image">
		<Button v-if="!isDisabled" severity="secondary" outlined class="clear-button" @click="$emit('clear')">
			<IconSVG name="mdiClose" variant="muted" size="sm" />
		</Button>
		<ImageBlock :blob-url="image" alt="Captured image preview" />
	</div>
</template>

<style scoped lang="scss">
@use '../../../assets/styles/buttons' as btn;

.preview-captured-image {
	position: relative;
	width: fit-content;
	height: fit-content;
	overflow: hidden;
	border-radius: var(--odk-radius);

	.clear-button {
		@include btn.clear-button;
		top: var(--odk-spacing-m);
		right: var(--odk-spacing-m);
		z-index: var(--odk-z-index-form-floating);
	}

	.media-block {
		background: var(--odk-muted-background-color);
		min-width: var(--odk-image-container-size);
		height: var(--odk-max-image-height);
		justify-content: center;
	}
}

/**
 * Below overrides PrimeVue style
 */
.p-button.clear-button {
	min-width: 0;
	padding: 12px;
	border-radius: var(--odk-radius);

	&:not(:disabled):active,
	&:not(:disabled):hover {
		border-color: var(--odk-inactive-background-color);
	}
}
</style>
