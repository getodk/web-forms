<script setup lang="ts">
import type { GroupNode } from '@getodk/xforms-engine';
import { computed } from 'vue';
import FormPanel from './FormPanel.vue';
import QuestionList from './QuestionList.vue';

const props = defineProps<{ node: GroupNode }>();

const tableLayout = computed(() => {
	return !!props.node.currentState.children.find(
		(c) =>
			c.nodeType === 'select' &&
			(c.appearances.label || c.appearances['list-nolabel'] || c.appearances.list)
	);
});
</script>

<template>
	<FormPanel :title="node.currentState.label?.asString" :no-ui="!node.currentState.label">
		<div :class="{ 'table-layout': tableLayout, 'gap-2': !tableLayout, 'flex': true, 'flex-column': true }">
			<QuestionList :nodes="node.currentState.children" />
		</div>
	</FormPanel>
</template>


<style scoped lang="scss">
.table-layout {
	width: max-content;
	min-width: 50%;
	display: table;
	max-width: 100%;
}
</style>
