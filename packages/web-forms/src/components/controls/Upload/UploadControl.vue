<script setup lang="ts">
import type { AcceptedUploadType, UploadNode } from '@getodk/xforms-engine';
import { computed } from 'vue';
import UploadImageControl from './UploadImageControl.vue';
import UploadNotImplemented from './UploadNotImplemented.vue';

export interface UploadControlProps {
	readonly question: UploadNode;
}

const props = defineProps<UploadControlProps>();

// prettier-ignore
const IMAGE_EXTENSION_TYPES = [
	'.jpg',
	'.jpeg',
	'.png',
	'.gif',
	'.svg',
	'.webp',
	'.avif',
] as const;

type ImageExtensionType = (typeof IMAGE_EXTENSION_TYPES)[number];

const isImageUploadType = (type: AcceptedUploadType): boolean => {
	return type.startsWith('image/') || IMAGE_EXTENSION_TYPES.includes(type as ImageExtensionType);
};

const isImageUploadControl = computed(() => {
	return props.question.nodeOptions.types.every(isImageUploadType);
});
</script>

<template>
	<template v-if="isImageUploadControl">
		<UploadImageControl :question="question" />
	</template>

	<template v-else>
		<UploadNotImplemented :question="question" />
	</template>
</template>
