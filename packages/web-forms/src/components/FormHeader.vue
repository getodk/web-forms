<script setup lang="ts">
import { type RootNode } from '@getodk/xforms-engine';
import PrimeButton from 'primevue/button';
import PrimeCard from 'primevue/card';
import PrimeMenu from 'primevue/menu';
import { ref } from 'vue';
import FormLanguageDialog from './FormLanguageDialog.vue';
import FormLanguageMenu from './FormLanguageMenu.vue';

const props = defineProps<{form: RootNode}>();
const languageDialogState = ref(false);
const menu = ref<PrimeMenu>();
const languages = props.form.languages.filter(language => !language.isSyntheticDefault);

const print = () => window.print();

const items = ref([
	{
		label: 'Print',
		icon: 'icon-local_printshop',
		command: print
	}
]);

if(languages.length > 0){
	items.value.unshift({
		label: 'Change language',
		icon: 'icon-language',
		command: () => languageDialogState.value = true
	})
}
</script>

<template>
	<!-- for desktop -->
	<div class="hidden lg:flex justify-content-end flex-wrap gap-3">
		<PrimeButton class="print-button" severity="secondary" rounded icon="icon-local_printshop" @click="print" />
		<FormLanguageMenu :form="form" />
	</div>
	<PrimeCard class="form-title hidden lg:block">
		<template #content>
			<!-- TODO/q: should the title be on the definition or definition.form be accessible instead of definition.bind.form -->
			<h1>{{ form.definition.bind.form.title }}</h1>
			<!-- last saved timestamp -->
		</template>
	</PrimeCard>

	<!-- for mobile and tablet -->
	<div class="lg:hidden smaller-screens">
		<div class="flex align-items-center">
			<h1 class="flex-grow-1">
				{{ form.definition.bind.form.title }}
			</h1>

			<!-- for tablet -->
			<div class="odk-menu-bar hidden md:flex justify-content-end gap-3">
				<PrimeButton class="print-button" severity="secondary" rounded icon="icon-local_printshop" @click="print" />
				<FormLanguageMenu :form="form" />
			</div>

			<!-- for mobile -->
			<PrimeButton icon="icon-menu" class="btn-menu md:hidden" text rounded aria-label="Menu" @click="menu?.toggle" />
			<PrimeMenu id="overlay_menu" ref="menu" :model="items" :popup="true" />
			<FormLanguageDialog v-model:state="languageDialogState" :form="form" />
		</div>
	</div>
</template>

<style scoped lang="scss">
.p-button.p-button-icon-only.p-button-rounded {
		height: 2.5rem;
		width: 2.5rem;
		min-width: 2.5rem;
		font-size: 1.5rem;

		&:hover{
			background: var(--primary-100);
		}
		&:active, &:focus {
			background: var(--primary-50);
		}
	}

.form-title {
	border-radius: 10px;
	box-shadow: 0px 1px 3px 1px #00000026;
	border-top: none;
	margin-top: 20px;

	:deep(.p-card-content) {
		padding: 0 1rem;

		h1 {
			font-size: 1.5rem;
			font-weight: 500;
			margin: 10px 0;
		}
	}
}

.smaller-screens {
	// this adds border to parent div so that bottom shadow of immediate child
	// is visible.
	border-bottom: 3px solid #fff;
	
	// to show ellipsis in the heading
	// https://css-tricks.com/using-flexbox-and-text-ellipsis-together/
	min-width: 0;

	> div {
		box-shadow: 0px 1px 2px 0px #0000004D;
	}

	h1 {
		padding-left: 10px;
		text-overflow: ellipsis;
		white-space: nowrap;
		overflow: hidden;
		font-size: 1.5rem;
	}
	
	.btn-menu{
		color: #000;
		font-size: 1.5rem;
	}
}

</style>
