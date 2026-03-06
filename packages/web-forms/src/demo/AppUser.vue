<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { store } from './store.js';

const route = useRoute();
const callbackUrl = route.query.cb as string;

console.log({callbackUrl});

interface FormListState {
	readonly id: string;
	readonly name: string;
}

const forms = ref<FormListState[]>();

async function fetchForms() {
	const formUrl = `${store.url}/formList`;
	const headers = {
		'X-OpenRosa-Version': '1.0'
	}
	const fetchOptions = {
		headers,
	};
	const res = await fetch(formUrl, fetchOptions);
	const formDeets = await res.text();

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
		});
		if (name && id) {
			result.push({ name, id });
		}
		form = xforms.iterateNext();
	}
	forms.value = result;
}

fetchForms();

</script>
<template>
	<div v-if="forms">
		<ul>
			<li v-for="form in forms">
				{{ form.name }}
				<RouterLink :to="{ name: 'form', params: { id: form.id } }">LOAD</RouterLink>
			</li>
		</ul>
	</div>
	<div v-else>
		Loading...
	</div>
</template>


