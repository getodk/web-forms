<script setup lang="ts">
import type {
	GeopointInputNode,
	GeopointNoteNode,
	InputValue,
	NoteValue,
} from '@getodk/xforms-engine';
import { computed } from 'vue';

type InputGeopointReadonly = GeopointInputNode | GeopointNoteNode;

type InputGeopointReadonlyValue = InputValue<'geopoint'> | NoteValue<'geopoint'>;

interface InputGeopointReadonlyProps {
	readonly question: InputGeopointReadonly;
}

const props = defineProps<InputGeopointReadonlyProps>();

const value = computed<InputGeopointReadonlyValue>(() => {
	return props.question.currentState.value;
});
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
