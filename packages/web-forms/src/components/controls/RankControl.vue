<script setup lang="ts">
import type { AnyRankNode } from '@getodk/xforms-engine';
import ControlText from '@/components/ControlText.vue';

interface RankControlProps {
	readonly question: AnyRankNode;
}

// ToDo: remove eslint-disable-next-line comment
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<RankControlProps>();
</script>

<template>
	<ControlText :question="question" />
	<p>{{ "Hi rank!" }}</p>
</template>

<style scoped lang="scss">

</style>
