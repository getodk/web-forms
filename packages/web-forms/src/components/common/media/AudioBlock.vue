<script setup lang="ts">
import MediaBlockBase from '@/components/common/media/MediaBlockBase.vue';
import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';

defineProps<{
	readonly resourceUrl?: JRResourceURL;
	readonly alt: string;
}>();
</script>

<template>
	<MediaBlockBase v-slot="{ mediaUrl, reportError }" :alt="alt" broken-file-image="broken-audio.svg" :resource-url="resourceUrl" :is-small-media="true">
		<audio
			controls
			:src="mediaUrl"
			:title="alt"
			class="audio-block"
			@error="reportError(new Error(`Failed to load audio. File: ${resourceUrl?.href}`))"
		/>
	</MediaBlockBase>
</template>

<style scoped lang="scss">
.audio-block {
	max-width: 100%;
	display: block;
}
</style>
