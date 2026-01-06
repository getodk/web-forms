<script setup lang="ts">
import { useMediaLoader } from '@/components/common/media/useMediaLoader.ts';
import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import { ref, watchEffect } from 'vue';

interface AudioBlockProps {
	readonly resourceUrl?: JRResourceURL;
	readonly alt: string;
}

const props = defineProps<AudioBlockProps>();

const loading = ref<boolean>(true);
const audioUrl = ref<string>('');
const errorMessage = ref<string>('');

const setAudio = (value: string) => {
	audioUrl.value = value;
	loading.value = false;
};

const handleError = (error: Error) => {
	loading.value = false;
	audioUrl.value = '';
	errorMessage.value = error.message;
};

const { loadMedia } = useMediaLoader(setAudio, handleError);
watchEffect(() => {
	errorMessage.value = '';
	void loadMedia(props.resourceUrl);
});
</script>

<template>
	<div :class="{ 'audio-block': true, 'broken-audio': errorMessage?.length }">
		<!-- TODO: translations -->
		<audio
			v-if="!loading && !errorMessage?.length"
			controls
			:src="audioUrl"
			:title="alt"
			@error="handleError(new Error(`Failed to load audio. File: ${props.resourceUrl?.href}`))"
		/>

		<div v-if="loading" class="skeleton-loading" />

		<template v-if="errorMessage?.length">
			<p class="audio-error-message">
				{{ errorMessage }}
			</p>
		</template>
	</div>
</template>

<style scoped lang="scss">
.audio-block {
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
	position: relative;
	width: 100%;
	overflow: hidden;

	audio {
		max-width: 100%;
		display: block;
	}

	&.broken-audio img {
		max-width: 90%;
		margin-top: 10px;
	}

	.audio-error-message {
		margin: 20px;
		font-size: var(--odk-hint-font-size);
		font-weight: 300;
		word-break: break-word;
		text-align: center;
		color: var(--odk-muted-text-color);
	}

	.skeleton-loading {
		min-width: 300px;
		min-height: 50px; // Adjusted for audio player height
	}
}
</style>
