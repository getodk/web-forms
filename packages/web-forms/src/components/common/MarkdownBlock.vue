<script lang="ts" setup>
import MarkdownBlock from '@/components/common/MarkdownBlock.vue';
import type { MarkdownNode } from '@getodk/xforms-engine';

interface MarkdownProps {
	readonly elem: MarkdownNode;
}

const { elem } = defineProps<MarkdownProps>();
</script>

<template>
	<span v-if="elem.elementName === 'span'" :style="{
		color: elem.properties?.style.color,
		'font-family': elem.properties?.style['font-family']
	}">
		<MarkdownBlock
			v-for="child in elem.children"
			:elem="child"
		/>
	</span>
	<a v-else-if="elem.elementName === 'a'" :href="elem.url" target="_blank">
		<MarkdownBlock
			v-for="child in elem.children"
			:elem="child"
		/>
	</a>
	<component :is="elem.elementName" v-else-if="elem.elementName">
		<MarkdownBlock
			v-for="child in elem.children"
			:elem="child"
		/>
	</component>
	<template v-else-if="elem.value">
		{{elem.value}}
	</template>
	<MarkdownBlock
		v-else
		v-for="child in elem.children"
		:elem="child"
	/> 

</template>
