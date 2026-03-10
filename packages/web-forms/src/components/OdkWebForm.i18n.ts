import type { TranslationDictionary } from '@/lib/i18n/i18n-context.ts';

export const defaultStrings: TranslationDictionary = {
	errors: {
		locationUnavailable: {
			string:
				'Location unavailable. Enable GPS and browser permissions, then restart the form to try again.',
			developer_comment: 'Error message shown when background geolocation fails.',
		},
		validationSingle: {
			string: '1 question with error.',
			developer_comment:
				'Message shown in the error banner when exactly one question has a validation error.',
		},
		validationMultiple: {
			string: '{count} questions with errors.',
			developer_comment:
				'Message shown in the error banner when multiple questions have validation errors. {count} is the number of errors.',
		},
	},
	actions: {
		submit: {
			string: 'Send',
			developer_comment: 'Label for the primary form submission button.',
		},
	},
};
