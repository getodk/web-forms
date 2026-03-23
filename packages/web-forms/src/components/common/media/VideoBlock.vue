<script setup lang="ts">
import MediaBlockBase from '@/components/common/media/MediaBlockBase.vue';
import { FORMAT_MESSAGE } from '@/lib/constants/injection-keys.ts';
import type { FormatMessage } from '@/lib/locale/useLocale.ts';
import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import { inject } from 'vue';

defineProps<{
	readonly resourceUrl: JRResourceURL;
	readonly alt: string;
}>();

const formatMessage: FormatMessage = inject(FORMAT_MESSAGE)!;
</script>

<template>
	<MediaBlockBase
		v-slot="{ mediaUrl, reportError }"
		:alt="alt"
		broken-file-image="broken-video.svg"
		:resource-url="resourceUrl"
		variant="full-width"
	>
		<video
			controls
			controlsList="nodownload noplaybackrate"
			:src="mediaUrl"
			:title="alt"
			class="video-block"
			@error="reportError(formatMessage({ id: 'video_block.load.error' }, { file: resourceUrl.href ?? '' }))"
		/>
	</MediaBlockBase>
</template>

<style scoped lang="scss">
.video-block {
	max-height: fit-content;
	max-width: 400px;
	width: 100%;
	height: auto;
	display: block;
	object-fit: contain;
}
</style>
