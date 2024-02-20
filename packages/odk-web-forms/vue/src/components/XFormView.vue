<template>
  <h1>{{ entry.form.title }}</h1>
  <XFormQuestionList :state="entry" />
</template>

<script setup lang="ts">
import { EntryState } from '../../../src/lib/xform/state/EntryState';
import XFormQuestionList from './XFormQuestionList.vue';

defineProps<{ entry: EntryState }>()
</script>

<style scoped></style>