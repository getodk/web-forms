<script setup lang="ts">
import type { HostSubmissionResultCallback } from '@/lib/submission/host-submission-result-callback';
import type { FetchFormAttachment, MissingResourceBehavior, MonolithicInstancePayload } from '@getodk/xforms-engine';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import OdkWebForm from '../components/OdkWebForm.vue';
import { store } from './store.js';

const route = useRoute();
const router = useRouter();
const formId = route.params.id as string;
const callbackUrl = route.query.cb as string;

console.log({callbackUrl});

interface FormState {
	readonly id: string;
	readonly xml: string;
	readonly fetchFormAttachment: FetchFormAttachment;
	readonly missingResourceBehavior: MissingResourceBehavior;
}

const missingResourceBehavior: MissingResourceBehavior = 'ERROR';
const fetchFormAttachment: FetchFormAttachment = async (resource) => {
	let filename;

	if (resource.href.startsWith('jr://file/')) {
		filename = resource.href.replace('jr://file/', '');
	} else if (resource.href.startsWith('jr://images/')) {
		filename = resource.href.replace('jr://images/', '');
	} else {
		filename = resource.href;
	}
	const attachmentUrl = `${store.url}/forms/${form.value!.id}/attachments/${filename}`;
	return await fetch(attachmentUrl);
};

const form = ref<FormState>();

async function loadForm(id:string) {
	console.log('loading', id);
	const formUrl = `${store.url}/forms/${id}.xml`;
	const res = await fetch(formUrl);
	const xml = await res.text();
	form.value = {
		id,
		xml,
		missingResourceBehavior,
		fetchFormAttachment
	};
}

if (formId) {
	loadForm(formId);
}

const handleSubmit = async (
	payload: MonolithicInstancePayload,
	clearFormCallback: HostSubmissionResultCallback
) => {
	const chunks = [];
	for (const value of payload.data[0].values()) {
		chunks.push(await value.text());
	}
	const body = chunks.join();
	const formUrl = `${store.url}/forms/${form.value!.id}/submissions`;
	const headers = {
		'Content-Type': 'application/xml'
	}
	const fetchOptions = {
		method: 'POST',
		headers,
		body
	};
	const res = await fetch(formUrl, fetchOptions);
	clearFormCallback();
	if (callbackUrl) {
		location.href = callbackUrl;
	} else {
		router.push({ name: 'app' });
	}
};

</script>
<template>
	<div v-if="form">
		<OdkWebForm
			:form-xml="form.xml"
			:submission-max-size="Infinity"
			:track-device="true"
			:fetch-form-attachment="form.fetchFormAttachment"
			@submit="handleSubmit"
		/>
	</div>
	<div v-else>
		Loading...
	</div>
</template>


