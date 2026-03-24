<script setup lang="ts">
import { ref, watchEffect } from 'vue';

type ObjectURL = `blob:${string}`;

export interface UploadAudioPreviewProps {
	readonly audio: ObjectURL | null;
}

const mediaUrl = ref<ObjectURL | undefined>();

defineEmits(['clear']);
const props = defineProps<UploadAudioPreviewProps>();

watchEffect(() => {
	if (props.audio != null) {
		mediaUrl.value = props.audio;
		return;
	}
});
</script>

<template>
	<audio v-if="mediaUrl" controls :src="mediaUrl" />
</template>

<style scoped lang="scss">
audio {
	width: 100%;
	max-width: 400px;
}
</style>
