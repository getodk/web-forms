import { Show, useContext } from 'solid-js';
import { Stack } from 'suid/material';
import { FormLanguageMenu } from '../FormLanguageMenu.tsx';
import { TranslationsContext } from '../TranslationsContext.tsx';

export const PageHeader = () => {
	const [getTranslations] = useContext(TranslationsContext);

	return (
		<Show when={getTranslations()} keyed={true}>
			{(translations) => {
				return (
					<Stack direction="row" justifyContent="flex-end">
						<FormLanguageMenu translations={translations} />
					</Stack>
				);
			}}
		</Show>
	);
};
