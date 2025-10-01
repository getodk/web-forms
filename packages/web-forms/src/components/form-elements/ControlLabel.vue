<script setup lang="ts">
import MarkdownBlock from '@/components/common/MarkdownBlock.vue';
import type { AnyControlNode as QuestionNode } from '@getodk/xforms-engine';
const props = defineProps<{ question: QuestionNode }>();
</script>

<template>
	<label :for="question.nodeId">
		<span v-if="question.currentState.required" class="required">* </span>
		<MarkdownBlock v-for="(elem, index) in props.question.currentState.label?.formatted" :key="index" :elem="elem" />
	</label>
</template>

<style scoped lang="scss">
label {
	font-weight: 400;
	font-size: var(--odk-question-font-size);
	line-height: 1.5rem;
	word-wrap: break-word;
	white-space: pre-wrap;

	.required {
		color: var(--odk-error-text-color);
	}
}
</style>
