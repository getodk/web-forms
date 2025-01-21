<script setup lang="ts">
import { inject, ref, watch } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import type { RankItem, RankNode } from '@getodk/xforms-engine';
import ControlText from '@/components/ControlText.vue';
import ValidationMessage from '@/components/ValidationMessage.vue';

interface RankControlProps {
	readonly question: RankNode;
}

interface DraggableOption {
	label: string;
	value: string;
}

const props = defineProps<RankControlProps>();
const options = ref<DraggableOption[]>([]);
const touched = ref(false);
const submitPressed = inject<boolean>('submitPressed');
const highlight = {
	index: ref(null),
	timeoutID: null,
};

const transformOptions = (rankOptions: RankItem[]) => {
	options.value = rankOptions.map((option: RankItem) => {
		const value = option.value;
		const valueOption = props.question.getValueOption(value);

		if (valueOption == null) {
			throw new Error(`Failed to find option for value: ${value}`);
		}

		return { value, label: valueOption.label.asString };
	});
};

watch(props.question.currentState.valueOptions, transformOptions, { immediate: true });

const setValues = () => {
	touched.value = true;
	props.question.setValues(options.value.map((option) => option.value));
};

const setHighlight = (index: number) => {
	highlight.index.value = index;

	if (highlight.timeoutID) {
		clearTimeout(highlight.timeoutID);
		highlight.timeoutID = null;
	}

	if (highlight.index.value !== null) {
		highlight.timeoutID = setTimeout(() => setHighlight(null), 1000);
	}
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
	if (newPosition >= options.value.length) {
		return;
	}
	swapItems(index, newPosition);
};

const swapItems = (index: number, newPosition: number) => {
	setHighlight(index);
	const temp = options.value[index];
	options.value[index] = options.value[newPosition];
	options.value[newPosition] = temp;
	setHighlight(newPosition);
};
</script>

<template>
	<ControlText :question="question" />

	<VueDraggable
		v-model="options"
		:id="question.nodeId"
		:delay="60"
		:disabled="question.currentState.readonly"
		ghost-class="fade-moving"
		class="rank-control"
		@update="setValues">
		<div
			v-for="(option, index) in options"
			:key="option.value"
			class="rank-option"
			:class="{ 'moving': highlight.index.value === index }"
			tabindex="0"
			@keydown.up.prevent="moveUp(index)"
			@keydown.down.prevent="moveDown(index)">
			<div class="rank-label">
				<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 768 768">
					<path d="M480 511.5q25.5 0 45 19.5t19.5 45-19.5 45-45 19.5-45-19.5-19.5-45 19.5-45 45-19.5zM480 319.5q25.5 0 45 19.5t19.5 45-19.5 45-45 19.5-45-19.5-19.5-45 19.5-45 45-19.5zM480 256.5q-25.5 0-45-19.5t-19.5-45 19.5-45 45-19.5 45 19.5 19.5 45-19.5 45-45 19.5zM288 127.5q25.5 0 45 19.5t19.5 45-19.5 45-45 19.5-45-19.5-19.5-45 19.5-45 45-19.5zM288 319.5q25.5 0 45 19.5t19.5 45-19.5 45-45 19.5-45-19.5-19.5-45 19.5-45 45-19.5zM352.5 576q0 25.5-19.5 45t-45 19.5-45-19.5-19.5-45 19.5-45 45-19.5 45 19.5 19.5 45z" />
				</svg>
				<span>{{ option.label }}</span>
			</div>

			<div class="rank-buttons">
				<button @click="moveUp(index)" @mousedown="setHighlight(index)">
					<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 768 768">
						<path d="M384 256.5l192 192-45 45-147-147-147 147-45-45z" />
					</svg>
				</button>

				<button @click="moveDown(index)" @mousedown="setHighlight(index)">
					<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 768 768">
						<path d="M531 274.5l45 45-192 192-192-192 45-45 147 147z" />
					</svg>
				</button>
			</div>
		</div>
	</VueDraggable>

	<ValidationMessage
		:message="question.validationState.violation?.message.asString"
		:show-message="touched || submitPressed"
	/>
</template>

<style scoped lang="scss">
@import 'primeflex/core/_variables.scss';

$rankSpacing: 7px;
$rankBorder: 1px solid var(--surface-200);
$rankBorderRadius: 10px;

.sortable-chosen {
	// Overriding VueDraggable's sortable-chosen class
	opacity: 0.9;
	background-color: var(--surface-0);
}

.rank-control {
	display: flex;
	flex-direction: column;
	flex-wrap: nowrap;
	align-items: flex-start;
	gap: $rankSpacing;
}

.rank-option {
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: $rankSpacing;
	border: $rankBorder;
	border-radius: $rankBorderRadius;
	font-size: 14px;
	line-height: 17px;
	color: var(--surface-600);
	cursor: move;

	.rank-label {
		display: flex;
		align-items: center;
		gap: $rankSpacing;
	}
}

.moving,
.fade-moving {
	background: var(--primary-50);
}

.fade-moving {
	opacity: 0.5;
}

.rank-buttons {
	display: flex;
	gap: $rankSpacing;

	button {
		border: $rankBorder;
		border-radius: $rankBorderRadius;
		background: var(--surface-0);
		padding: $rankSpacing;
		line-height: 0;
	}

	button:hover {
		background: var(--primary-50);
	}
}

@media screen and (max-width: #{$sm}) {
	.rank-buttons {
		display: none;
	}
}
</style>
