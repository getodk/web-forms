import type { TranslationDictionary } from '@/lib/i18n/i18n-context.ts';

export const defaultStrings: TranslationDictionary = {
	title: {
		string: 'An error occurred while loading this form',
		developer_comment: 'Title of the error dialog that appears when the form fails to initialize.',
	},
	detailsSummary: {
		string: 'Technical error details',
		developer_comment:
			'Label for the collapsible section containing stack traces or raw error messages.',
	},
};
