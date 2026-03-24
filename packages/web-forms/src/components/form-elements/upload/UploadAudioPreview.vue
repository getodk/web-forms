<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import Button from 'primevue/button';
import { ref, watchEffect } from 'vue';

type ObjectURL = `blob:${string}`;

export interface UploadAudioPreviewProps {
	readonly isDisabled: boolean;
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
	<div v-if="audio" class="file-preview-content">
		<audio controls :src="mediaUrl" />
		<span>
			<Button v-if="!isDisabled" severity="secondary" outlined class="clear-button" @click="$emit('clear')">
				<IconSVG name="mdiClose" variant="muted" size="sm" />
			</Button>
		</span>
	</div>
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;

audio {
	max-width: 100%;
}
.file-preview-content {
	display: flex;
	align-items: center;
	flex-wrap: wrap-reverse;
	gap: var(--odk-spacing-xxl);
}
.file-preview-content span {
	flex-grow: 1;
}
@media screen and (max-width: #{pf.$sm}) {
	.file-preview-content span {
		text-align: right;
	}
}

/**
 * Below overrides PrimeVue style
 */
.p-button.clear-button {
	min-width: 0;
	padding: 12px;
	border-radius: var(--odk-radius);

	&:not(:disabled):active,
	&:not(:disabled):hover {
		border-color: var(--odk-inactive-background-color);
	}
}
</style>
