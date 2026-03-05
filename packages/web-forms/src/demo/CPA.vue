<script setup lang="ts">
	import { ref } from 'vue';

	interface FormListState {
		readonly id: string;
		readonly name: string;
		readonly callback: string;
	};

	const formlist = ref<FormListState[]>();
	formlist.value = [{
		id: 'all-question-types',
		name: 'All',
		callback: encodeURIComponent('http://localhost:5173/#/cpa')
	}];
</script>

<template>
	<h2>Which survey would you like to run?</h2>
	<ul>
		<li v-for="form of formlist"><a :href="'http://localhost:5173/#/app/' + form.id + '?cb=' + form.callback">{{ form.name }}</a></li>
	</ul>
</template>
