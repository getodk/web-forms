<script setup lang="ts">
import type { HostSubmissionResultCallback } from '@/lib/submission/host-submission-result-callback';
import type { FetchFormAttachment, MissingResourceBehavior, MonolithicInstancePayload } from '@getodk/xforms-engine';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import OdkWebForm from '../components/OdkWebForm.vue';

const route = useRoute();
const formId = route.params.id as string;
const callbackUrl = route.query.cb as string;

console.log({callbackUrl});

interface FormListState {
	readonly id: string;
	readonly name: string;
}

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
	const url = `/v1/key/${key}/projects/1/forms/${form.value!.id}/attachments/${filename}`;
	return await fetch(url);
};

const forms = ref<FormListState[]>();
const form = ref<FormState>();

const key = 'FCC$kQfHz1$PBGGayQ$E!$GDue3OtBUxQ3OeA2ymEysMeKqhtNQiF5Aid37LAW6s';

async function fetchForms() {
	const formUrl = `/v1/key/${key}/projects/1/formList`;
	const headers = {
		'X-OpenRosa-Version': '1.0'
	}
	const fetchOptions = {
		headers,
	};
	const res = await fetch(formUrl, fetchOptions);
	const formDeets = await res.text();

	// const formDeets = `  <xforms xmlns="http://openrosa.org/xforms/xformsList">
  //   <xform>
  //     <formID>all-question-types</formID>
  //     <name>All question types</name>
  //     <version>2024091201-4</version>
  //     <hash>md5:f89594bfec40a6f14c1348bbc334c035</hash>
  //     <downloadUrl>http://localhost:8989/v1/key/FCC$kQfHz1$PBGGayQ$E!$GDue3OtBUxQ3OeA2ymEysMeKqhtNQiF5Aid37LAW6s/projects/1/forms/all-question-types.xml</downloadUrl>
  //     <manifestUrl>http://localhost:8989/v1/key/FCC$kQfHz1$PBGGayQ$E!$GDue3OtBUxQ3OeA2ymEysMeKqhtNQiF5Aid37LAW6s/projects/1/forms/all-question-types/manifest</manifestUrl>
  //   </xform>
  // </xforms>`

	const parser = new DOMParser();
	console.log(formDeets);
	const doc = parser.parseFromString(formDeets, 'application/xml');
	const ns = () => 'http://openrosa.org/xforms/xformsList';
	const xforms = doc.evaluate('/or:xforms/or:xform', doc, ns, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
	console.log({xforms});
	let form = xforms.iterateNext();
	console.log({form});
	const result: FormListState[] = [];
	while(form) {
		console.log(form);
		const res:FormListState = {id: '', name: ''};
		let id;
		let name;
		form.childNodes.forEach(node => {
			if (node.nodeType !== Node.TEXT_NODE) {
				if (node.nodeName === 'name') {
					name = node.textContent;
				} else if (node.nodeName === 'formID') {
					id = node.textContent;
				}
			}
			// if (node.nodeName === 'name'
		});
		if (name && id) {
			result.push({ name, id });
		}
		form = xforms.iterateNext();
	}
	// const xforms = doc.querySelectorAll('xform');
	// xforms.forEach
	// console.log({ xforms });
	// formState.value = {
	// 	formXML
	// };
	forms.value = result;
}


async function loadForm(id:string) {
	console.log('loading', id);
	const formUrl = `/v1/key/${key}/projects/1/forms/${id}.xml`;
	// const headers = {
	// 	'X-OpenRosa-Version': '1.0'
	// }
	const fetchOptions = {
		// headers,
	};
	const res = await fetch(formUrl, fetchOptions);
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
} else {
	fetchForms();
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
	const formUrl = `/v1/key/${key}/projects/1/forms/${form.value!.id}/submissions`;
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
		alert('submitted successfully');
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
	<div v-else-if="forms">
		<ul>
			<li v-for="form in forms">{{ form.name }} <a href="#" v-on:click.prevent @click="loadForm(form.id)">LOAD</a></li>
		</ul>
	</div>
	<div v-else>
		Loading...
	</div>
	<!--
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
	-->
</template>


