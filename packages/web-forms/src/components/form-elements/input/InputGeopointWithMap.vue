<script setup lang="ts">
import AsyncMap from '@/components/common/map/AsyncMap.vue';
import { type Mode, MODES } from '@/components/common/map/getModeConfig.ts';
import { FORM_MODES, type FormMode } from '@/lib/constants/form-modes.ts';
import { FORM_MODE } from '@/lib/constants/injection-keys.ts';
import type { GeopointInputNode } from '@getodk/xforms-engine';
import { computed, type ComputedRef, inject } from 'vue';

interface InputGeopointProps {
	readonly question: GeopointInputNode;
}

const formMode = inject<ComputedRef<FormMode> | null>(FORM_MODE, null);

const props = defineProps<InputGeopointProps>();

const mode = computed<Mode | null>(() => {
	if (formMode?.value === FORM_MODES.EDIT || props.question.appearances['placement-map']) {
		return MODES.PLACEMENT;
	}

	if (props.question.appearances.maps) {
		return MODES.LOCATION;
	}

	return null;
});
</script>

<template>
	<AsyncMap
		v-if="mode"
		:disabled="question.currentState.readonly"
		:mode="mode"
		:saved-feature-value="question.currentState.instanceValue"
		@save="(value) => question.setValue(value ?? '')"
	/>
</template>
