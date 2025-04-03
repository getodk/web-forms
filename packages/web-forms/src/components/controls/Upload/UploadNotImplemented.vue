<script setup lang="ts">
import type { UploadNode } from '@getodk/xforms-engine';

export interface UploadNotImplementedProps {
	readonly question: UploadNode;
}

defineProps<UploadNotImplementedProps>();
</script>
<template>
	<p>Upload not supported for at least one of the following types:</p>

	<ul>
		<li v-for="type in question.nodeOptions.types" :key="type">
			{{ type }}
		</li>
	</ul>
</template>
