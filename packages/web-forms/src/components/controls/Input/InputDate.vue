<script setup lang="ts">
import Calendar from 'primevue/calendar';
import { ref } from 'vue';

const value = ref(new Date('1990-02-23'));
</script>

<template>
	<Calendar v-model="value" showIcon iconDisplay="input" showButtonBar disabled="disabled"/>
</template>

<style scoped lang="scss">


</style>
