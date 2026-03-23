<script setup lang="ts">
import { FORMAT_MESSAGE } from '@/lib/constants/injection-keys.ts';
import type { FormatMessage } from '@/lib/locale/useLocale.ts';
import type { GeneralChildNode, GroupNode, RepeatInstanceNode } from '@getodk/xforms-engine';
import { type MenuItem } from 'primevue/menuitem';
import { computed, inject } from 'vue';
import FormPanel from './FormPanel.vue';
import QuestionList from './QuestionList.vue';

const formatMessage: FormatMessage = inject(FORMAT_MESSAGE)!;
const props = defineProps<{ instance: RepeatInstanceNode; instanceIndex: number }>();

const isGroup = (child: GeneralChildNode | undefined) => {
	return child?.definition.bodyElement?.type === 'group';
};

const label = computed(() => {
	// It has just one child and that is a group with label
	// then we use label of that group
	const childLabel =
		props.instance.currentState.children.length === 1 &&
		isGroup(props.instance.currentState.children[0]) &&
		props.instance.currentState.children[0]?.currentState.label;
	if (childLabel) {
		return { formatted: childLabel.formatted };
	}

	// Use parent (repeat range) label if it's there
	const parentLabel = props.instance.currentState.label;
	if (parentLabel) {
		return { formatted: parentLabel.formatted };
	}

	return { literal: formatMessage({ id: 'repeat.instance.placeholder' }), };
});

const children = computed(() => {
	// It has just one child and that is a group
	// then we use its children - essentially coalesce RepeatInstance and Group into one.
	if (
		props.instance.currentState.children.length === 1 &&
		isGroup(props.instance.currentState.children[0])
	) {
		return (props.instance.currentState.children[0] as GroupNode).currentState.children;
	}

	return props.instance.currentState.children;
});

const menuItems = computed((): MenuItem[] | undefined => {
	const { parent } = props.instance;

	if (parent.nodeType === 'repeat-range:controlled') {
		return;
	}

	return [
		{
			label: formatMessage({ id: 'repeat.remove.label' }),
			icon: 'icon-delete',
			command: () => {
				return parent.removeInstances(props.instanceIndex);
			},
		},
	];
});
</script>
<template>
	<FormPanel
		v-if="instance.currentState.hasRelevantBodyNodes"
		:title="label.literal"
		:title-formatted="label.formatted"
		:menu-items="menuItems"
		:label-number="instanceIndex + 1"
		:is-repeat="true"
	>
		<QuestionList :nodes="children" />
	</FormPanel>
</template>
