<script setup lang="ts">
import type { SelectNode } from '@getodk/xforms-engine';
import RadioButton from '../widgets/RadioButton.vue';

defineProps<{question: SelectNode}>();

</script>

<template>
	<div class="likert">
		<RadioButton :question="question" />
	</div>
</template>

<style scoped lang="scss">
.likert {
	display: flex;
	flex-wrap: nowrap;
	flex-direction: row;
	line-height: 20px;

	:deep(.value-option) {
		display: flex;
		flex-direction: column;
		flex: 1;
		align-items: center;
		cursor: pointer;
		outline: none;
		padding:0;

		&:hover {
			background-color: unset;
		}

		&.active {
			background-color: unset;
			outline: none;
		}


		.p-radiobutton {
			position: relative;
			z-index: 10;
		}

		span {
			text-align: center;
			border-top: 3px solid #ccc;
			margin-top: -11.5px;
			margin-left: 0;
			width: 100%;
			position: relative;
			padding-top: 20px;
			display: block;
			word-break: break-word;
		}

		&:first-of-type {
			span::after {
				content: '';
				display: block;
				position: absolute;
				top: -8px;
				width: 50%;
				background-color: #fff;
				height: 10px;
				left: 0;
			}
		}

		&:last-of-type {
			span::after {
				content: '';
				display: block;
				position: absolute;
				top: -8px;
				width: 50%;
				background-color: #fff;
				height: 10px;
				right: 0;
			}
		}

	}
}
</style>