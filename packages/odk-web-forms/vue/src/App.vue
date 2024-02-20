<template>
    <ul v-if="!selectedForm">
        <li v-for="form in demoForms">
            {{ form[0] }}
            <button @click="selectedForm = form">Show</button>
        </li>
    </ul>
    <div v-else>
        <button @click="selectedForm = undefined">Back</button>
        Selected Form: {{ selectedForm[0] }}
        <OdkWebForm :xform="selectedForm[1]" />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import OdkWebForm from './components/OdkWebForm.vue';

const formFixtureGlobImports = import.meta.glob('../../fixtures/xforms/**/*.xml', {
    as: 'raw',
    eager: true,
});
const demoForms = Object.entries(formFixtureGlobImports);

demoForms.forEach(f => {
    f[0] = f[0].replace('../../fixtures/xforms/', '')
})

const selectedForm = ref<[string, string]>();

</script>



<style scoped></style>
