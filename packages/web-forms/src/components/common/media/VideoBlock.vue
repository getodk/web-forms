<script setup lang="ts">
import { useMediaLoader } from '@/components/common/media/useMediaLoader.ts';
import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import { ref, watchEffect } from 'vue';

interface VideoBlockProps {
	readonly resourceUrl?: JRResourceURL;
	readonly alt: string;
}

const props = defineProps<VideoBlockProps>();

const loading = ref<boolean>(true);
const videoUrl = ref<string>('');
const errorMessage = ref<string>('');

const setVideo = (value: string) => {
	videoUrl.value = value;
	loading.value = false;
};

const handleError = (error: Error) => {
	loading.value = false;
	videoUrl.value = '';
	errorMessage.value = error.message;
};

const { loadMedia } = useMediaLoader(setVideo, handleError);
watchEffect(() => {
	errorMessage.value = '';
	void loadMedia(props.resourceUrl);
});
</script>

<template>
	<div :class="{ 'video-block': true, 'broken-video': errorMessage?.length }">
		<!-- TODO: translations -->
		<video
			v-if="!loading && !errorMessage?.length"
			controls
			:src="videoUrl"
			:title="alt"
			@error="handleError(new Error(`Failed to load video. File: ${props.resourceUrl?.href}`))"
		/>

		<div v-if="loading" class="skeleton-loading" />

		<template v-if="errorMessage?.length">
			<img src="../../../assets/images/broken-image.svg" :alt="alt">
			<p class="video-error-message">
				{{ errorMessage }}
			</p>
		</template>
	</div>
</template>

<style scoped lang="scss">
.video-block {
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
	position: relative;
	width: 100%;
	overflow: hidden;

	video {
		max-height: var(--odk-max-video-height);
		max-width: 100%;
		width: auto;
		height: auto;
		display: block;
		object-fit: contain;
	}

	&.broken-video img {
		max-width: 90%;
		margin-top: 10px;
	}

	.video-error-message {
		margin: 20px;
		font-size: var(--odk-hint-font-size);
		font-weight: 300;
		word-break: break-word;
		text-align: center;
		color: var(--odk-muted-text-color);
	}

	.skeleton-loading {
		min-width: 300px;
		min-height: 200px; // Adjusted for video player height
	}
}
</style>
