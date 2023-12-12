import { onCleanup, onMount, useContext } from 'solid-js';
import ChevronLeft from 'suid/icons-material/ChevronLeft';
import { Button, styled } from 'suid/material';
import { XFormDefinition } from '../../lib/xform/XFormDefinition.ts';
import { EntryState } from '../../lib/xform/state/EntryState.ts';
import { TranslationsContext } from '../TranslationsContext.tsx';
import { XFormView } from '../XForm/XFormView.tsx';
import { DEMO_ROOT_PATH } from './DemoRoot.tsx';

const DemoBackLink = styled(Button)(({ theme }) => ({
	marginBlockEnd: theme.spacing(2),
}));

interface DemoFormEntryProps {
	readonly xformXML: string;
}

export const DemoFormEntry = (props: DemoFormEntryProps) => {
	const form = new XFormDefinition(props.xformXML);
	const entry = new EntryState(form);
	const [, setTranslations] = useContext(TranslationsContext);

	onMount(() => {
		setTranslations(entry.translations);
	});

	onCleanup(() => {
		setTranslations(null);
	});

	return (
		<>
			<DemoBackLink href={DEMO_ROOT_PATH}>
				<ChevronLeft />
				Demo forms
			</DemoBackLink>
			<XFormView entry={entry} />
		</>
	);
};
