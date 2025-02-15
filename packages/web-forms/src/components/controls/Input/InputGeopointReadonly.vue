<script setup lang="ts">
import type { InputValue } from '@getodk/xforms-engine';

interface InputGeopointReadonlyProps {
	readonly value: InputValue<'geopoint'>;
}

defineProps<InputGeopointReadonlyProps>();
</script>

<template>
	<!-- TODO: translations -->
	<p class="geopoint-value">
		<span v-if="value?.accuracy != null">Accuracy: {{ value.accuracy }}m</span>
		<span v-if="value?.latitude != null">Latitude: {{ value.latitude }}</span>
		<span v-if="value?.longitude != null">Longitude: {{ value.longitude }}</span>
	</p>
</template>

<style scoped lang="scss">
.geopoint-value > span {
	margin-right: 10px;
}
</style>
