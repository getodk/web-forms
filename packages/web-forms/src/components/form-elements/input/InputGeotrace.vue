<script setup lang="ts">
import AsyncMap from '@/components/common/map/AsyncMap.vue';
import { MODES } from '@/components/common/map/getModeConfig.ts';
import type { GeopointInputNode } from '@getodk/xforms-engine';

interface InputGeoshapeProps {
	readonly question: GeopointInputNode; // ToDo: GeopointGeotraceNode;
}

defineProps<InputGeoshapeProps>();
</script>

<template>
	<AsyncMap
		:disabled="question.currentState.readonly"
		draw-feature-type="trace"
		:mode="MODES.DRAW"
		:saved-feature-value="question.currentState.instanceValue"
		@save="(value) => question.setValue(value ?? '')"
	/>
</template>
