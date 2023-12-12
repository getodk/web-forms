import { useNavigate } from '@solidjs/router';
import { Show, onMount, useContext } from 'solid-js';
import { DemoContext } from './DemoContext.tsx';
import { DemoFormEntry } from './DemoFormEntry.tsx';
import { DEMO_ROOT_PATH } from './DemoRoot.tsx';

export const UPLOADED_FORM_PATH = '/user-upload/';

export const UploadedForm = () => {
	const demoContext = useContext(DemoContext);
	const navigate = useNavigate();

	onMount(() => {
		if (demoContext.formUpload() == null) {
			navigate(DEMO_ROOT_PATH);
		}
	});

	return (
		<Show when={demoContext.formUpload()} keyed={true}>
			{({ xformXML }) => {
				return <DemoFormEntry xformXML={xformXML} />;
			}}
		</Show>
	);
};
