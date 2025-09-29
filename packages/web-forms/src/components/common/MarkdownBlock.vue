<script lang="ts" setup>
import MarkdownBlock from '@/components/common/MarkdownBlock.vue';

interface MarkdownProps {
	readonly elem: any; // export MarkdownElement from client interface
}

const { elem } = defineProps<MarkdownProps>();
</script>

<template>
	<strong v-if="elem.elementName === 'strong'">
		<MarkdownBlock
			v-for="child in elem.children"
			:elem="child"
		/>
	</strong>
	<em v-else-if="elem.elementName === 'em'">
		<MarkdownBlock
			v-for="child in elem.children"
			:elem="child"
		/>
	</em>
	<template v-else-if="elem.value">
		{{elem.value}}
	</template>
	<MarkdownBlock
		v-else
		v-for="child in elem.children"
		:elem="child"
	/>

</template>
