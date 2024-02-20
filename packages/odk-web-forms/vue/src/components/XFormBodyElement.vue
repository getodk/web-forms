<template>
  <XFormControl v-if="state.type === 'value-node'" :state="state" />
  <!-- <XFormGroup v-else /> -->
</template>

<script setup lang="ts">
import { AnyBodyElementDefinition } from '../../../src/lib/xform/body/BodyDefinition';
import { AnyChildState } from '../../../src/lib/xform/state/NodeState';
import XFormControl from './XFormControl.vue';

defineProps<{ readonly state: AnyChildState, readonly element: AnyBodyElementDefinition }>();
</script>

<style scoped></style>