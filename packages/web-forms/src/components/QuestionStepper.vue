<script setup lang="ts">
import { ref, computed, watch, provide } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import type {
	AnyControlNode,
	AnyUnsupportedControlNode,
	GeneralChildNode,
	GroupNode,
	RepeatRangeNode,
} from '@getodk/xforms-engine';
import FormGroup from './FormGroup.vue';
import FormQuestion from './FormQuestion.vue';
import RepeatRange from './RepeatRange.vue';
import ExpectModelNode from './dev-only/ExpectModelNode.vue';
import Steps from 'primevue/steps';
import ProgressBar from 'primevue/progressbar';
import Button from 'primevue/button';

const props = defineProps<{ nodes: readonly GeneralChildNode[] }>();
const emit = defineEmits(['endOfForm']);

const isGroupNode = (node: GeneralChildNode): node is GroupNode => {
	return node.nodeType === 'group';
};

type NonGroupNode = Exclude<GeneralChildNode, GroupNode>;

const isRepeatRangeNode = (node: NonGroupNode): node is RepeatRangeNode => {
	return (
		node.nodeType === 'repeat-range:controlled' || node.nodeType === 'repeat-range:uncontrolled'
	);
};

type NonStructuralNode = Exclude<NonGroupNode, RepeatRangeNode>;

type ControlNode = AnyControlNode | AnyUnsupportedControlNode;

const isControlNode = (node: NonStructuralNode): node is ControlNode => {
	const { nodeType } = node;

	return (
		nodeType === 'input' ||
		nodeType === 'note' ||
		nodeType === 'select' ||
		nodeType === 'trigger' ||
		nodeType === 'range' ||
		nodeType === 'rank' ||
		nodeType === 'upload'
	);
};

// Compute step items (only groups, repeat ranges, and control nodes should be steps)
const relevantNodes = computed(() =>
	props.nodes.filter(node => node.currentState.relevant)
);
const steps = computed(() =>
	relevantNodes.value
		.filter(node => isGroupNode(node) || isRepeatRangeNode(node) || isControlNode(node))
);

// Handle stepper state
const currentStep = ref(0);
const isCurrentStepValidated = ref(true);
const submitPressed = ref(false);
provide('submitPressed', submitPressed);

const validateStep = () => {
    // Manually trigger submitPressed to display error messages
	submitPressed.value = true;

    const currentNode = steps.value[currentStep.value];
    if (isGroupNode(currentNode) && currentNode.validationState.violations.length > 0) {
        isCurrentStepValidated.value = false;
    } else if (currentNode.validationState.violation) {
        isCurrentStepValidated.value = false;
    } else {
        isCurrentStepValidated.value = true;
    }
}
const nextStep = () => {
    validateStep();

	if (isCurrentStepValidated.value && currentStep.value < steps.value.length - 1) {
        // Reset validation triggered later in the form
	    submitPressed.value = false;
        // Also reset validation state of current node
        isCurrentStepValidated.value = true;
		currentStep.value++;
	}
};
const prevStep = () => {
	if (currentStep.value > 0) {
		currentStep.value--;
	}
};
const isLastStep = computed(() => currentStep.value === steps.value.length - 1);
watch(isLastStep, (newValue) => {
    emit('endOfForm', newValue);
});

// // Calculate stepper progress
// const totalNodes = computed(() => 
// 	Math.max(relevantNodes.value.length - 1, 1) // Ensure at least 1 to avoid division by zero
// );
// 
// const currentNodeIndex = computed(() => {
//    const activeNode = steps.value[currentStep.value];
//    if (!activeNode) return 0;
//
//    // Find the current node's position among relevant nodes
//    const index = relevantNodes.value.findIndex(node => node.nodeId === activeNode.nodeId);
//    return Math.max(index, 0); // Ensure it starts at 0
// });
//
// const progress = computed(() => {
// 	if (totalNodes.value === 1) return 100; // If there's only one relevant node, treat it as complete
// 	return (currentNodeIndex.value / totalNodes.value) * 100;
// });
</script>

<template>
    <!-- TODO -->
    <!-- <ProgressBar :value="progress"></ProgressBar> -->

	<div class="stepper-container">
		<div v-for="(step, index) in steps" :key="step.nodeId">
			<template v-if="index === currentStep">
				<!-- Render group nodes -->
				<FormGroup v-if="isGroupNode(step)" :node="step" />

				<!-- Render repeat nodes -->
				<RepeatRange v-else-if="isRepeatRangeNode(step)" :node="step" />

				<!-- Render individual questions -->
				<FormQuestion v-else-if="isControlNode(step)" :question="step" />

				<ExpectModelNode v-else :node="step" />
			</template>
		</div>

		<div class="navigation-buttons">
			<Button label="Previous" @click="prevStep" :disabled="currentStep === 0" />
			<Button label="Next" @click="nextStep" :disabled="isCurrentStepValidated && currentStep === steps.length - 1" />
		</div>
	</div>
</template>

<style scoped lang="scss">
.navigation-buttons {
	display: flex;
	justify-content: space-between;
	width: 100%;
	margin-top: 1rem;
}
</style>
