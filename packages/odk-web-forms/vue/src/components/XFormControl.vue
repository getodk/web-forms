<template>
  <template v-if="control">
    <XFormInputControl v-if="controlType === 'input'" :state="state" :control="control" />
  </template>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { ValueNodeState } from '../../../src/lib/xform/state/ValueNodeState';
import XFormInputControl from './XFormInputControl.vue';

const props = defineProps<{ readonly state: ValueNodeState }>();

const controlType = props.state.definition.bodyElement?.type;
const control = props.state.definition.bodyElement;


if (props.state.calculateVue) {
  watch(props.state.calculateVue.dependencies, () => {
    if (props.state.calculateVue) {
      const computedValue = props.state.calculateVue.evaluateExpression() as string;
      props.state.setValue(computedValue);
      props.state.vueValue.value = computedValue;
    }

  })
}

</script>

<style scoped></style>