<script setup lang="ts">
import { inject, type Ref, ref, watch } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import type { RankNode, RankNodeState } from '@getodk/xforms-engine';
import ControlText from '@/components/ControlText.vue';
import ValidationMessage from '@/components/ValidationMessage.vue';

interface RankControlProps {
	readonly question: RankNode;
}

interface RankDraggableOption {
	value: string;
	label: string | null;
}

interface HighlightOption {
	index: Ref<number | null>;
	timeoutID: NodeJS.Timeout | null;
}

const props = defineProps<RankControlProps>();
const HOLD_DELAY = 200; // Delay in ms to hold an item before dragging, avoids accidental reordering on swipe.
const options = ref<RankDraggableOption[]>([]);
const touched = ref(false);
const submitPressed = inject<boolean>('submitPressed');
const highlight: HighlightOption = {
	index: ref(null),
	timeoutID: null,
};

const transformOptions = (currentState: RankNodeState) => {
	const orderedValues: readonly string[] = props.question.getOrderedValues(
		currentState.valueOptions,
		currentState.value
	);

	if (orderedValues.length) {
		options.value = orderedValues.map((item): RankDraggableOption => {
			return {
				label: props.question.getValueLabel(item)?.asString ?? null,
				value: item,
			};
		});

		return;
	}

	options.value = currentState.valueOptions.map((item) => {
		return {
			label: props.question.getValueLabel(item.value)?.asString ?? null,
			value: item.value,
		};
	});
};

watch(props.question.currentState, transformOptions, { immediate: true });

const setValues = () => {
	touched.value = true;
	props.question.setValues(options.value.map((option) => option.value));
};

const setHighlight = (index: number | null) => {
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
	setValues();
	setHighlight(newPosition);
};
</script>

<template>
	<ControlText :question="question" />

	<VueDraggable
		:id="question.nodeId"
		v-model="options"
		:delay="HOLD_DELAY"
		:delay-on-touch-only="true"
		:disabled="question.currentState.readonly"
		ghost-class="fade-moving"
		class="rank-control"
		@update="setValues"
	>
		<div
			v-for="(option, index) in options"
			:id="option.value"
			:key="option.value"
			class="rank-option"
			:class="{ 'moving': highlight.index.value === index }"
			tabindex="0"
			@keydown.up.prevent="moveUp(index)"
			@keydown.down.prevent="moveDown(index)"
		>
			<div class="rank-label">
				<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 768 768">
					<path d="M480 511.5q25.5 0 45 19.5t19.5 45-19.5 45-45 19.5-45-19.5-19.5-45 19.5-45 45-19.5zM480 319.5q25.5 0 45 19.5t19.5 45-19.5 45-45 19.5-45-19.5-19.5-45 19.5-45 45-19.5zM480 256.5q-25.5 0-45-19.5t-19.5-45 19.5-45 45-19.5 45 19.5 19.5 45-19.5 45-45 19.5zM288 127.5q25.5 0 45 19.5t19.5 45-19.5 45-45 19.5-45-19.5-19.5-45 19.5-45 45-19.5zM288 319.5q25.5 0 45 19.5t19.5 45-19.5 45-45 19.5-45-19.5-19.5-45 19.5-45 45-19.5zM352.5 576q0 25.5-19.5 45t-45 19.5-45-19.5-19.5-45 19.5-45 45-19.5 45 19.5 19.5 45z" />
				</svg>
				<span>{{ option.label }}</span>
			</div>

			<div class="rank-buttons">
				<button
					:class="{ 'invisible': index === 0 }"
					@click="moveUp(index)"
					@mousedown="setHighlight(index)"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 768 768">
						<path d="M384 256.5l192 192-45 45-147-147-147 147-45-45z" />
					</svg>
				</button>

				<button
					:class="{ 'invisible': index === options.length - 1 }"
					@click="moveDown(index)"
					@mousedown="setHighlight(index)"
				>
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

// Variable definition to root element
.rank-control {
	--rankSpacing: 7px;
	--rankBorder: 1px solid var(--surface-200);
	--rankBorderRadius: 10px;
}

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
	gap: var(--rankSpacing);
}

.rank-option {
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: var(--rankSpacing);
	border: var(--rankBorder);
	border-radius: var(--rankBorderRadius);
	font-size: 14px;
	line-height: 17px;
	color: var(--surface-600);
	cursor: move;

	.rank-label {
		display: flex;
		align-items: center;
		gap: var(--rankSpacing);
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
	gap: var(--rankSpacing);

	button {
		border: var(--rankBorder);
		border-radius: var(--rankBorderRadius);
		background: var(--surface-0);
		padding: var(--rankSpacing);
		line-height: 0;
	}

	button:hover {
		background: var(--primary-50);
	}

	button.invisible {
		visibility: hidden;
	}
}

@media screen and (max-width: #{$sm}) {
	.rank-buttons {
		display: none;
	}
}
</style>
