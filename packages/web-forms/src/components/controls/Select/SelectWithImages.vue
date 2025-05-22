<script setup lang="ts">
import ImageDisplay from '@/components/widgets/ImageDisplay.vue';
import RadioButton from 'primevue/radiobutton';
import { selectOptionId } from '@/lib/format/selectOptionId.ts';
import type { SelectNode } from '@getodk/xforms-engine';

interface SelectWithImagesProps {
	readonly question: SelectNode;
}

const props = defineProps<SelectWithImagesProps>();

defineEmits(['update:modelValue', 'change']);

const selectValue = (value: string) => {
	props.question.selectValue(value);
};
</script>

<template>
	<div
		:class="{
			'select-with-images-container': true,
			disabled: question.currentState.readonly,
			'no-buttons': question.appearances['no-buttons'],
		}"
	>
		<div
			v-for="option in question.currentState.valueOptions"
			:key="option.value"
			:class="{
				'select-option': true,
				active: question.currentState.value[0] === option.value,
			}"
		>
			<label
				:key="option.value"
				:for="selectOptionId(question, option)"
				class="select-label-wrapper"
			>
				<RadioButton
					:input-id="selectOptionId(question, option)"
					:value="option.value"
					:name="question.nodeId"
					:model-value="question.currentState.value[0]"
					:disabled="question.currentState.readonly"
					@update:model-value="selectValue"
					@change="$emit('change')"
				/>
				<span>{{ option.label.asString }}</span>
			</label>

			<!-- TODO: handle error emit -->
			<ImageDisplay
				:src="option.label.imageSource"
				:alt="option.label.asString"
				@error="console.error('Image failed to load:', $event)"
			/>
		</div>
	</div>
</template>

<style scoped lang="scss">
.select-with-images-container {
	display: grid;
	gap: 16px;
	padding: 16px;
}

/* Default: 1 column for small screens */
.select-with-images-container {
	grid-template-columns: 1fr;
}

/* 2 columns for medium screens (min-width: 768px) */
@media (min-width: 768px) {
	.select-with-images-container {
		grid-template-columns: repeat(2, 1fr);
	}
}

/* 3 columns for large screens (min-width: 1024px) */
@media (min-width: 1024px) {
	.select-with-images-container {
		grid-template-columns: repeat(3, 1fr);
	}
}

/* 4 columns for extra large screens (min-width: 1280px) */
@media (min-width: 1280px) {
	.select-with-images-container {
		grid-template-columns: repeat(4, 1fr);
	}
}

.select-option {
	background-color: var(--odk-base-background-color);
	border-radius: var(--odk-radius);
	border: 1px solid var(--odk-border-color);
	overflow: hidden;
}

.select-option.active {
	border: 1px solid var(--odk-primary-border-color);
}

.select-label-wrapper {
	padding: 8px;
	display: flex;
	align-items: center;
	gap: 8px;
}

.select-label-wrapper span {
	font-size: 14px;
	color: #333;
}

.disabled {
	opacity: 0.5;
	pointer-events: none;
}

.no-buttons .select-label-wrapper {
	display: none;
}
</style>
