<script lang="ts" setup>
import ColumnarAppearance from '@/components/appearances/ColumnarAppearance.vue';
import FieldListTable from '@/components/appearances/FieldListTable.vue';
import SelectWithImages from '@/components/controls/Select/SelectWithImages.vue';
import UnsupportedAppearance from '@/components/controls/UnsupportedAppearance.vue';
import ControlText from '@/components/ControlText.vue';
import ValidationMessage from '@/components/ValidationMessage.vue';
import LikertWidget from '@/components/widgets/LikertWidget.vue';
import RadioButton from '@/components/widgets/RadioButton.vue';
import SearchableDropdown from '@/components/widgets/SearchableDropdown.vue';
import type { SelectNode } from '@getodk/xforms-engine';
import { computed, inject, ref } from 'vue';

interface Select1ControlProps {
	readonly question: SelectNode;
}

const props = defineProps<Select1ControlProps>();

const appearances = [...props.question.appearances];
const hasColumnsAppearance = appearances.some((appearance) => appearance.startsWith('columns'));
const hasFieldListRelatedAppearance = appearances.some((appearance) => {
	return ['label', 'list-nolabel', 'list'].includes(appearance);
});

const touched = ref(false);
const submitPressed = inject<boolean>('submitPressed', false);
const isSelectWithImages = computed(() => props.question.currentState.isSelectWithImages === true);
</script>

<template>
	<ControlText v-if="!hasFieldListRelatedAppearance" :question="question" />

	<SelectWithImages v-if="isSelectWithImages" :question="question" />

	<SearchableDropdown
		v-else-if="question.appearances.autocomplete || question.appearances.minimal"
		:question="question"
		@change="touched = true"
	/>

	<LikertWidget
		v-else-if="question.appearances.likert"
		:question="question"
		@change="touched = true"
	/>

	<FieldListTable v-else-if="hasFieldListRelatedAppearance" :appearances="question.appearances">
		<template #firstColumn>
			<ControlText :question="question" />
		</template>
		<template #default>
			<RadioButton :question="question" @change="touched = true" />
		</template>
	</FieldListTable>

	<ColumnarAppearance v-else-if="hasColumnsAppearance" :appearances="question.appearances">
		<RadioButton :question="question" @change="touched = true" />
	</ColumnarAppearance>

	<template v-else>
		<template v-if="question.appearances.map || question.appearances['image-map']">
			<UnsupportedAppearance
				:appearance="[...question.appearances].toString()"
				node-type="Select1"
			/>
		</template>
		<div class="default-appearance">
			<RadioButton :question="question" @change="touched = true" />
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
