<script setup lang="ts">
import MediaBlockBase from '@/components/common/media/MediaBlockBase.vue';
import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';

defineProps<{
	readonly resourceUrl?: JRResourceURL;
	readonly alt: string;
}>();
</script>

<template>
	<MediaBlockBase v-slot="{ mediaUrl, reportError }" :alt="alt" broken-file-image="broken-video.svg" :resource-url="resourceUrl" :is-small-media="true">
		<video
			controls
			:src="mediaUrl"
			:title="alt"
			class="video-block"
			@error="reportError(new Error(`Failed to load video. File: ${resourceUrl?.href}`))"
		/>
	</MediaBlockBase>
</template>

<style scoped lang="scss">
.video-block {
	max-height: var(--odk-max-video-height);
	max-width: 100%;
	width: auto;
	height: auto;
	display: block;
	object-fit: contain;
}
</style>
