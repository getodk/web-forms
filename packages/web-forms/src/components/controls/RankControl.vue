<script setup lang="ts">
import { ref } from 'vue';
import { type UseDraggableReturn, VueDraggable } from 'vue-draggable-plus';

import type { AnyRankNode } from '@getodk/xforms-engine';
import ControlText from '@/components/ControlText.vue';

interface RankControlProps {
	readonly question: AnyRankNode;
}

// ToDo: remove eslint-disable-next-line comment
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<RankControlProps>();

const originalList = [
	{
		name: 'Career Growth and Learning Opportunities',
		id: 1,
	},
	{
		name: 'Time Management and Work-Life Balance',
		id: 2,
	},
	{
		name: 'Building a Supportive Community',
		id: 3,
	},
	{
		name: 'Personal Development and Mindfulness',
		id: 4,
	},
	{
		name: 'Financial Stability',
		id: 5,
	},
	{
		name: 'Family and Friends',
		id: 6,
	},
];
const list = ref([...originalList]);
const activeIndex = ref(null);
const el = ref<UseDraggableReturn>();
const disabled = ref(false);

const swapItems = (index: number, newPosition: number) => {
	activeIndex.value = index;
	const temp = list.value[index];
	list.value[index] = list.value[newPosition];
	list.value[newPosition] = temp;

	activeIndex.value = newPosition;
	setTimeout(() => {
		activeIndex.value = null;
	}, 1000);
};

const moveUp = (index: number) => {
	const newPosition = index - 1;
	if (newPosition < 0) {
		return;
	}
	swapItems(index, newPosition);
};

const moveDown = (index: number) => {
	const newPosition = index + 1;
	if (newPosition >= list.value.length) {
		return;
	}
	swapItems(index, newPosition);
};
</script>

<template>
	<ControlText :question="question" />

	<VueDraggable
		ref="el"
		v-model="list"
		:disabled="disabled"
		:delay="100"
		ghostClass="ghost"
		class="rank-control"
	>
		<div
			v-for="(item, index) in list"
			:key="item.id"
			class="rank-item"
			:class="{ 'ghost-solid': activeIndex === index }"
			tabindex="0"
			@keydown.up.prevent="moveUp(index)"
			@keydown.down.prevent="moveDown(index)"
		>
			<div class="rank-label">
				<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="25" height="25" viewBox="0 0 768 768">
					<path d="M480 511.5q25.5 0 45 19.5t19.5 45-19.5 45-45 19.5-45-19.5-19.5-45 19.5-45 45-19.5zM480 319.5q25.5 0 45 19.5t19.5 45-19.5 45-45 19.5-45-19.5-19.5-45 19.5-45 45-19.5zM480 256.5q-25.5 0-45-19.5t-19.5-45 19.5-45 45-19.5 45 19.5 19.5 45-19.5 45-45 19.5zM288 127.5q25.5 0 45 19.5t19.5 45-19.5 45-45 19.5-45-19.5-19.5-45 19.5-45 45-19.5zM288 319.5q25.5 0 45 19.5t19.5 45-19.5 45-45 19.5-45-19.5-19.5-45 19.5-45 45-19.5zM352.5 576q0 25.5-19.5 45t-45 19.5-45-19.5-19.5-45 19.5-45 45-19.5 45 19.5 19.5 45z"/>
				</svg>
				<span>{{ item.name }}</span>
			</div>
			<div class="rank-manual-control">
				<button @click="moveUp(index)">
					<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="15" height="15" viewBox="0 0 768 768">
						<path d="M384 256.5l192 192-45 45-147-147-147 147-45-45z"/>
					</svg>
				</button>
				<button @click="moveDown(index)">
					<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="15" height="15" viewBox="0 0 768 768">
						<path d="M531 274.5l45 45-192 192-192-192 45-45 147 147z"/>
					</svg>
				</button>
			</div>
		</div>
	</VueDraggable>
</template>

<style scoped lang="scss">
.rank-control {
	display: flex;
	flex-direction: column;
	flex-wrap: nowrap;
	align-items: flex-start;
	gap: 7px;
}
.rank-item {
	width: 100%;
	padding: 18px;
	border: 1px solid #E5E7EB;
	border-radius: 10px;
	font-size: 14px;
	line-height: 17px;
	color: #4B5563;
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	justify-content: space-between;
	cursor: move;
}
.rank-label {
	display: flex;
	align-items: center;
	gap: 10px;
}
.sortable-chosen {
	opacity: 0.9;
	background-color: #FFFFFF;
}
.ghost {
	opacity: 0.5;
	background: #F4FAFE;
}
.ghost-solid {
	background: #F4FAFE;
}
.rank-manual-control {
	display: flex;
	gap: 7px;
}
.rank-manual-control button {
	border: 1px solid #E5E7EB;
	border-radius: 10px;
	background: white;
	padding: 9px;
	line-height: 0;
}

@media screen and (max-width: 576px) {
	.rank-manual-control {
		display: none;
	}
}
</style>
