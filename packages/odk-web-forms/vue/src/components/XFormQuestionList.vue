<template>
  <template v-for="child in state.children">
    <XFormBodyElement v-if="child.definition.bodyElement" :state="child" :element="child.definition.bodyElement" />
  </template>
</template>

<script setup lang="ts">
import { AnyParentState } from '../../../src/lib/xform/state/NodeState';
import XFormBodyElement from './XFormBodyElement.vue';

defineProps<{ state: AnyParentState }>();
</script>

<style scoped></style>