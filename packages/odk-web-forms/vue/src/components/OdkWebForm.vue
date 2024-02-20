<template>
  <XFormView :entry="entry" />
</template>

<script setup lang="ts">
import { XFormDefinition } from '../../../src/lib/xform/XFormDefinition';
import { EntryState } from '../../../src/lib/xform/state/EntryState';
import XFormView from './XFormView.vue';

const props = defineProps<{ xform: string }>();

const definition = new XFormDefinition(props.xform);
const entry = new EntryState(definition);
</script>

<style scoped></style>