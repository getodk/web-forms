<template>
  <!-- TODO evaluate the label instead -->
  <label :for="control.reference">{{ (<any>control.label?.parts[0]).textContent }}</label>
  <input type="text" :name="control.reference" :id="control.reference" :value="state.vueValue.value"
    @input="updateState" />
</template>

<script setup lang="ts">

import { InputDefinition } from '../../../src/lib/xform/body/control/InputDefinition';
import { ValueNodeState } from '../../../src/lib/xform/state/ValueNodeState';

const props = defineProps<{ readonly control: InputDefinition, readonly state: ValueNodeState }>();

props.state.vueValue.value = props.state.getValue();

const updateState = (event: Event) => {
  const target: HTMLInputElement = event.target as HTMLInputElement;

  props.state.setValue(target?.value);
  props.state.vueValue.value = target?.value;
}
</script>

<style scoped>
input {
  display: block;
  margin-bottom: 20px;
}
</style>