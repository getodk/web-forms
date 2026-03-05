<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const formLinkId = route.params.id as string;
const serverToken = route.query.st as string;

interface FormState {
	readonly formXML: string;
}

const formState = ref<FormState>();

async function fetchForm() {
	const formUrl = `http://localhost:8989/v1/form-links/${formLinkId}/form?st=${serverToken}`;
	const res = await fetch(formUrl);
	const formDeets = await res.json();
	console.log({ formDeets });
	// formState.value = {
	// 	formXML
	// };
}

fetchForm();
</script>
<template>
	<template v-if="formState">
		<OdkWebForm
			:form-xml="formState.formXML"
			:submission-max-size="Infinity"
			:track-device="true"
		/>
	</template>
	<div v-else>
		Loading...
	</div>
</template>



