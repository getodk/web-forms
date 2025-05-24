<script lang="ts" setup>
import ColumnarAppearance from '@/components/appearances/ColumnarAppearance.vue';
import FieldListTable from '@/components/appearances/FieldListTable.vue';
import UnsupportedAppearance from '@/components/controls/UnsupportedAppearance.vue';
import ControlText from '@/components/ControlText.vue';
import ValidationMessage from '@/components/ValidationMessage.vue';
import CheckboxWidget from '@/components/widgets/CheckboxWidget.vue';
import MultiselectDropdown from '@/components/widgets/MultiselectDropdown.vue';
import type { SelectNode } from '@getodk/xforms-engine';
import { inject, ref, watch } from 'vue';

interface SelectNControlProps {
	readonly question: SelectNode;
}

const props = defineProps<SelectNControlProps>();

const appearances = [...props.question.appearances];
const hasColumnsAppearance = appearances.some((appearance) => appearance.startsWith('columns'));
const hasFieldListRelatedAppearance = appearances.some((appearance) => {
	return ['label', 'list-nolabel', 'list'].includes(appearance);
});

const touched = ref(false);
const submitPressed = inject<boolean>('submitPressed', false);
const errorMessage = ref<string>('');

const handleError = (error: Error) => {
	errorMessage.value = error.message;
};

watch(
	() => props.question.currentState.valueOptions,
	() => (errorMessage.value = '')
);
</script>

<template>
	<ControlText v-if="!hasFieldListRelatedAppearance" :question="question" />

	<MultiselectDropdown
		v-if="question.appearances.autocomplete || question.appearances.minimal"
		:question="question"
		@change="touched = true"
	/>

	<FieldListTable v-else-if="hasFieldListRelatedAppearance" :appearances="question.appearances">
		<template #firstColumn>
			<ControlText :question="question" />
		</template>
		<template #default>
			<CheckboxWidget :question="question" @change="touched = true" @error="handleError" />
		</template>
	</FieldListTable>

	<ColumnarAppearance v-else-if="hasColumnsAppearance" :appearances="question.appearances">
		<CheckboxWidget :question="question" @change="touched = true" @error="handleError" />
	</ColumnarAppearance>

	<template v-else>
		<template v-if="question.appearances.map || question.appearances['image-map']">
			<UnsupportedAppearance
				:appearance="[...question.appearances].toString()"
				node-type="Select"
			/>
		</template>
		<div class="default-appearance">
			<CheckboxWidget :question="question" @change="touched = true" @error="handleError" />
		</div>
	</template>

	<ValidationMessage
		:message="question.validationState.violation?.message.asString"
		:show-message="touched || submitPressed"
		:add-placeholder="!hasFieldListRelatedAppearance"
	/>
</template>

<style lang="scss" scoped>
@use 'primeflex/core/_variables.scss' as pf;
.default-appearance {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 0.8rem;

	@media screen and (min-width: #{pf.$md}) {
		min-width: 50%;
		width: max-content;
		max-width: 100%;
	}
}
</style>
