<script setup lang="ts">
import { GeopointAccuracy } from '@/lib/geopoint/GeopointAccuracy.ts';

interface GeopointAccuracyQualityProps {
	readonly accuracy: GeopointAccuracy;
}

defineProps<GeopointAccuracyQualityProps>();
</script>

<template>
	<!--
		TODO: this conditional preserves a check that existed in earlier iterations.
		It will always be true. What was the original intent of the check?
	-->
	<template v-if="accuracy.label">
		{{ accuracy.label }}
	</template>
</template>
