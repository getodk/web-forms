<template>
  <!-- add non label  -->
  <TextWidget :control="control" :state="state" />
</template>

<script setup lang="ts">
import { InputDefinition } from '../../../src/lib/xform/body/control/InputDefinition';
import { ValueNodeState } from '../../../src/lib/xform/state/ValueNodeState';
import TextWidget from './TextWidget.vue';

defineProps<{ readonly control: InputDefinition, readonly state: ValueNodeState }>()
</script>

<style scoped></style>