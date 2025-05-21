<script setup lang="ts">
import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import type { FormSetupOptions } from '@/lib/init/loadFormState.ts';
import { createObjectURL } from '@getodk/common/lib/web-compat/url.ts';
import { ref, watchEffect } from 'vue';
import { getCachedImage, cacheImage } from '@/lib/cache/image.ts';

interface ImageDisplayProps {
	readonly src: JRResourceURL | null;
	readonly alt: string;
	readonly formSetupOptions: FormSetupOptions;
}

const props = defineProps<ImageDisplayProps>();
const imageUrl = ref<string | null>(null);

const loadImage = async (src: JRResourceURL | null) => {
	if (src == null || props.formSetupOptions?.form?.fetchFormAttachment == null) {
		// ToDo handle
		throw new Error('Failed to load media resource.');
	}

	const cachedImage = getCachedImage(src);
	if (cachedImage != null) {
		imageUrl.value = cachedImage;
		return;
	}

	try {
		const response = await props.formSetupOptions.form.fetchFormAttachment(src);
		if (response.status === 404) {
			if (props.formSetupOptions.form.missingResourceBehavior === 'BLANK') {
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
		cacheImage(src, blobUrl);
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
