<script setup lang="ts">
import { POST_SUBMIT__NEW_INSTANCE } from '@/lib/constants/control-flow';
import type { HostSubmissionResultCallback } from '@/lib/submission/host-submission-result-callback';
import { xformFixturesByCategory, XFormResource } from '@getodk/common/fixtures/xforms.ts';
import type {
	ChunkedInstancePayload,
	FetchFormAttachment,
	MissingResourceBehavior,
	MonolithicInstancePayload,
	PreloadProperties,
} from '@getodk/xforms-engine';
import { constants as ENGINE_CONSTANTS } from '@getodk/xforms-engine';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import OdkWebForm from '../components/OdkWebForm.vue';
import FeedbackButton from './FeedbackButton.vue';

const route = useRoute();

const categoryParam = route.params.category as string;
const formParam = route.params.form as string;

interface FormPreviewState {
	readonly formXML: string;
	readonly fetchFormAttachment: FetchFormAttachment;
	readonly missingResourceBehavior: MissingResourceBehavior;
}

const formPreviewState = ref<FormPreviewState>();

// TODO: REMOVE THIS MOCK. Temporal for testing translations
const mockFetchTranslations = async (localeCode: string) => {
	// Simulate network latency
	await new Promise((resolve) => setTimeout(resolve, 300));

	if (localeCode === 'es') {
		return {
			OdkWebForms: {
				actions: {
					submit: { string: 'Enviar', developer_comment: '' },
				},
				errors: {
					locationUnavailable: { string: 'Ubicación no disponible.', developer_comment: '' },
					validationSingle: { string: '1 pregunta con error.', developer_comment: '' },
					validationMultiple: { string: '{count} preguntas con errores.', developer_comment: '' },
				},
				footer: {
					poweredBy: { string: 'Desarrollado por', developer_comment: '' },
				},
			},
			FormLoadFailureDialog: {
				title: { string: 'Ocurrió un error al cargar este formulario', developer_comment: '' },
				detailsSummary: { string: 'Detalles técnicos del error', developer_comment: '' },
			},
		};
	}

	throw new Error(`Locale ${localeCode} not found`);
};

let missingResourceBehavior: MissingResourceBehavior =
	ENGINE_CONSTANTS.MISSING_RESOURCE_BEHAVIOR.DEFAULT;

let xformResource: XFormResource<'local'> | XFormResource<'remote'> | undefined;

if (route.query.url) {
	xformResource = XFormResource.fromRemoteURL(route.query.url.toString());
	missingResourceBehavior = ENGINE_CONSTANTS.MISSING_RESOURCE_BEHAVIOR.BLANK;
} else if (formParam) {
	xformResource = xformFixturesByCategory.get(categoryParam)?.find((fixture) => {
		return fixture.identifier === formParam;
	});
}

xformResource
	?.loadXML()
	.then((formXML) => {
		if (typeof formXML !== 'string') {
			throw new Error('Wrong XML Form type. Expected a string');
		}

		formPreviewState.value = {
			formXML,
			fetchFormAttachment: xformResource.fetchFormAttachment,
			missingResourceBehavior,
		};
	})
	.catch((error) => {
		// eslint-disable-next-line no-console
		console.error('Failed to load the Form XML', error);

		alert('Failed to load the Form XML');
	});

const handleSubmit = async (
	payload: MonolithicInstancePayload,
	clearFormCallback: HostSubmissionResultCallback
) => {
	// eslint-disable-next-line no-console
	console.log('submission payload:', payload);
	for (const value of payload.data[0].values()) {
		// eslint-disable-next-line no-console
		console.log(await value.text());
	}
	alert('Submit button was pressed');
	clearFormCallback({ next: POST_SUBMIT__NEW_INSTANCE });
};

const handleSubmitChunked = (payload: ChunkedInstancePayload) => {
	// eslint-disable-next-line no-console
	console.log('CHUNKED submission payload:', payload);
};

const preloadProperties: PreloadProperties = {
	email: 'fake@fake.fake',
	phoneNumber: '+1235556789',
	username: 'nousername',
};
</script>
<template>
	<template v-if="formPreviewState">
		<OdkWebForm
			:form-xml="formPreviewState.formXML"
			:fetch-form-attachment="formPreviewState.fetchFormAttachment"
			:fetch-translations="mockFetchTranslations"
			:missing-resource-behavior="formPreviewState.missingResourceBehavior"
			:submission-max-size="Infinity"
			:preload-properties="preloadProperties"
			:track-device="true"
			@submit="handleSubmit"
			@submit-chunked="handleSubmitChunked"
		/>
		<FeedbackButton />
	</template>
	<div v-else>
		Loading...
	</div>
</template>
