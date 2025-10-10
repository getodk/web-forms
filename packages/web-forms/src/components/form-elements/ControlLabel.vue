<script setup lang="ts">
import MarkdownBlock from '@/components/common/MarkdownBlock.vue';
import type { AnyControlNode as QuestionNode } from '@getodk/xforms-engine';
const props = defineProps<{ question: QuestionNode }>();
</script>

<template>
	<label :for="question.nodeId" :class="{ required: question.currentState.required }">
		<MarkdownBlock v-for="(elem, index) in props.question.currentState.label?.formatted" :key="index" :elem="elem" />
	</label>
</template>

<style scoped lang="scss">
label {
	font-weight: 400;
	font-size: var(--odk-question-font-size);
	line-height: 1.5rem;
	word-wrap: break-word;
	display: inline-block;
	width: 100%;

	&.required::before {
		content: '*';
		color: var(--odk-error-text-color);
		float: left;
		margin-right: 5px;
	}

	:first-child {
		margin-top: 0;
	}
}
</style>
