<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import Button from 'primevue/button';
import { ref, watchEffect } from 'vue';

type ObjectURL = `blob:${string}`;

export interface UploadVideoPreviewProps {
	readonly isDisabled: boolean;
	readonly video: ObjectURL | null;
}

const mediaUrl = ref<ObjectURL | undefined>();

defineEmits(['clear']);
const props = defineProps<UploadVideoPreviewProps>();

watchEffect(() => {
	if (props.video != null) {
		mediaUrl.value = props.video;
		return;
	}
});
</script>

<template>
	<div v-if="video" class="preview-captured-video">
		<Button v-if="!isDisabled" severity="secondary" outlined class="clear-button" @click="$emit('clear')">
			<IconSVG name="mdiClose" variant="muted" size="sm" />
		</Button>
		<video controls :src="mediaUrl" />
	</div>
</template>

<style scoped lang="scss">
@use '../../../assets/styles/buttons' as btn;

.preview-captured-video {
	position: relative;
	width: fit-content;
	height: fit-content;
	overflow: hidden;

	.clear-button {
		@include btn.clear-button;
		top: 10px;
		right: 10px;
		z-index: var(--odk-z-index-form-floating);
	}

	.media-block {
		background: var(--odk-muted-background-color);
		min-width: var(--odk-image-container-size);
		height: var(--odk-max-image-height);
		justify-content: center;
	}

	video {
		max-width: 100%;
		max-height: var(--odk-max-image-height);
		border-radius: var(--odk-radius);
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
