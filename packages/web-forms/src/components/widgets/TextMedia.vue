<script setup lang="ts">
import ImageBlock from '@/components/widgets/ImageBlock.vue';
import type { TextRange } from '@getodk/xforms-engine';
import { computed } from 'vue';

interface TextMediaProps {
	readonly label: TextRange<'item-label'>;
}

const props = defineProps<TextMediaProps>();

const text = computed(() => props.label.asString);
const image = computed(() => props.label.imageSource);
const video = computed(() => props.label.videoSource);
const audio = computed(() => props.label.audioSource);
</script>

<template>
	<span v-if="text != null" class="text-content">text</span>

	<ImageBlock v-if="image != null" :src="image" :alt="text" />

	<!-- TODO: Implement VideoBlock component -->
	<span v-else-if="video != null">🚧 Video media type is not supported</span>

	<!-- TODO: Implement AudioBlock component -->
	<span v-else-if="audio != null">🚧 Video media type is not supported</span>
</template>

<style scoped lang="scss">
.text-content {
	margin-left: 0;
}
</style>
