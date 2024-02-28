import { Show, type JSX } from 'solid-js';
import { Divider, Stack } from 'suid/material';
import { Page } from './components/Page/Page.tsx';
import { ThemeProvider } from './components/ThemeProvider.tsx';
import { XFormDetails } from './components/XForm/XFormDetails.tsx';
import { XFormView } from './components/XForm/XFormView.tsx';
import { EntryState } from './lib/xform/state/EntryState.ts';

interface AppProps {
	readonly extras?: JSX.Element;
	readonly entry: EntryState | null;
}

export const App = (props: AppProps) => {
	return (
		<ThemeProvider>
			<Page entry={props.entry}>
				{props.extras}
				<Show when={props.entry} keyed={true}>
					{(entry) => {
						return (
							<Stack spacing={4}>
								<Stack spacing={7}>
									<XFormView entry={entry} />
									<Divider />
									<XFormDetails entry={entry} />
								</Stack>
							</Stack>
						);
					}}
				</Show>
			</Page>
		</ThemeProvider>
	);
};
