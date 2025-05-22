<script setup lang="ts">
import type { FormOptions } from '@/lib/init/loadFormState.ts';
import type {
	JRResourceURL,
	JRResourceURLString,
} from '@getodk/common/jr-resources/JRResourceURL.ts';
import { createObjectURL, type ObjectURL } from '@getodk/common/lib/web-compat/url.ts';
import { inject, ref, watchEffect } from 'vue';

interface ImageDisplayProps {
	readonly src: JRResourceURL | null;
	readonly alt: string;
}

const props = defineProps<ImageDisplayProps>();
const formOptions = inject<FormOptions>('formOptions');
const imageCache = inject<Map<JRResourceURLString, ObjectURL>>('imageCache', new Map());
const imageUrl = ref<string | null>(null);

const loadImage = async (src: JRResourceURL | null) => {
	if (src == null || formOptions?.fetchFormAttachment == null) {
		// ToDo handle
		throw new Error('Failed to load media resource.');
	}

	const cachedImage = imageCache.get(src.href);
	if (cachedImage != null) {
		imageUrl.value = cachedImage;
		return;
	}

	try {
		const response = await formOptions.fetchFormAttachment(src);
		if (response.status === 404) {
			if (formOptions.missingResourceBehavior === 'BLANK') {
				// ToDo handle
				throw new Error('No media resource.');
			}
			// ToDo handle
			throw new Error('Media resource not found.');
		}

		if (!response.ok || response.status !== 200) {
			// ToDo handle
			throw new Error('Failed to load media resource.');
		}

		const data = await response.blob();
		const blobUrl = createObjectURL(data);
		imageCache.set(src.href, blobUrl);
		imageUrl.value = blobUrl;
	} catch (error) {
		// ToDo handle
		console.error('Failed to load image:', error);
		imageUrl.value = null;
	}
};

watchEffect(() => {
	loadImage(props.src).catch((error) => {
		// ToDo handle or ignore
		console.error('Image failed to load:', error);
	});
});
</script>

<template>
	<div class="image-display">
		<!-- TODO: handle error emit -->
		<img
			v-if="imageUrl"
			:src="imageUrl"
			:alt="alt"
			@error="$emit('error', $event)"
		/>
		<div v-else class="fallback">
			PLACEHOLDER
			<!-- TODO: add placeholder -->
		</div>
		<!-- TODO: add loading indicator -->
	</div>
</template>

<style scoped lang="scss">
.image-display {
	--imageSize: 300px;
}

.image-display {
	display: flex;
	justify-content: center;
	align-items: center;
	position: relative;
	width: fit-content;
	height: var(--imageSize);
	background: var(--odk-muted-background-color);
	border-radius: var(--odk-radius);
	overflow: hidden;

	img {
		max-height: var(--imageSize);
		max-width: 100%;
		width: auto;
		height: auto;
		display: block;
		object-fit: contain;
	}

	.small-image {
		width: var(--imageSize);
	}
}
</style>
