<script setup lang="ts">
import AsyncMap from '@/components/common/map/AsyncMap.vue';
import { MODES } from '@/components/common/map/getModeConfig.ts';
import type { GeopointInputNode } from '@getodk/xforms-engine';

interface InputGeoshapeProps {
	readonly question: GeopointInputNode; // ToDo: GeopointGeoshapeNode;
}

defineProps<InputGeoshapeProps>();
</script>

<template>
	<!-- TODO: add input to tell the expected featyre type to draw
		if different data for a different feature type is provided, then we can show an error and turn off
		autocomplete if it's expected to be trace or something -->
	<AsyncMap
		:disabled="question.currentState.readonly"
		draw-feature-type="shape"
		:mode="MODES.DRAW"
		:saved-feature-value="question.currentState.instanceValue"
		@save="(value) => question.setValue(value ?? '')"
	/>
</template>
