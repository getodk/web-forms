<script setup lang="ts">
import AsyncMap from '@/components/common/map/AsyncMap.vue';
import type { GeopointInputNode } from '@getodk/xforms-engine';

interface InputGeopointProps {
	readonly question: GeopointInputNode;
}

defineProps<InputGeopointProps>();
</script>

<template>
	<AsyncMap
		:features="question.currentState.instanceValue ? [question.currentState.instanceValue] : []"
		:saved-feature-value="question.currentState.instanceValue"
		:disabled="question.currentState.readonly"
		@save="(value) => question.setValue(value ?? '')"
	/>
</template>
