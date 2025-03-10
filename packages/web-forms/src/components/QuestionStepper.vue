<script setup lang="ts">
import { ref, computed, provide } from 'vue';
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
const emit = defineEmits(['sendFormFromStepper']);

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
const firstStep = 0;
const finalStep = steps.value.length;
const currentStep = ref(firstStep);
const submitPressed = ref(false);
provide('submitPressed', submitPressed);

const allFieldsValid = () => {
    // Manually trigger submitPressed to display error messages
	submitPressed.value = true;

    const currentNode = steps.value[currentStep.value];

    // Check group error array
    if (isGroupNode(currentNode) && currentNode.validationState.violations.length > 0) {
        return false;

    // Check question single error
    } else if (currentNode.validationState.violation) {
        return false;
    }

    return true;
}
const nextStep = () => {
    if (!allFieldsValid()) {
        // There was an error validating
        return false;
    }

    // Do not increment further if at end of form
	if (currentStep.value < steps.value.length - 1) {
        // Reset validation triggered later in the form
	    submitPressed.value = false;
		currentStep.value++;
	}
};
const prevStep = () => {
	if (currentStep.value > firstStep) {
		currentStep.value--;
	}
};

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
	</div>

    <div class="navigation-button-group">
        <!-- If swapping to arrows: 🡨 🡪 -->
        <Button v-if="currentStep > firstStep" class="navigation-button" label="Back" @click="prevStep" rounded outlined />
        <Button v-if="currentStep === finalStep" class="navigation-button" label="Send" @click="allFieldsValid ? emit('sendFormFromStepper') : null" rounded />
        <!-- Note the button ordering is important here as we use a last-child selector for styling -->
        <Button v-if="currentStep < finalStep" class="navigation-button" label="Next" @click="nextStep" rounded outlined />
    </div>
</template>

<style scoped lang="scss">
.stepper-container {
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	overflow-y: auto;
	padding-bottom: 3rem;

	:deep(.p-panel) {
		box-shadow: none;
	}
}

.navigation-button-group {
	display: flex;
	position: fixed;
	bottom: 0;
	left: 0;
	width: 100%;
	background: white;
	padding: 1rem;
	justify-content: space-between;
	box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
}

/* Ensure Next button is on the right when Back is hidden */
.navigation-button-group .navigation-button:last-child {
	margin-left: auto;
}

/* If only one button is visible, align it to the right */
.navigation-button-group:has(.navigation-button:first-child:last-child) {
	justify-content: flex-end;
}

.navigation-button {
    padding-left: 3rem;
    padding-right: 3rem;
    font-size: 1rem;
}
</style>
