import {
	Show,
	Suspense,
	createEffect,
	createMemo,
	createResource,
	createSignal,
	on,
	untrack,
} from 'solid-js';
import { Divider, Stack } from 'suid/material';
import { DemoFixturesList, type SelectedDemoFixture } from './components/Demo/DemoFixturesList.tsx';
import { Page } from './components/Page/Page.tsx';
import { ThemeProvider } from './components/ThemeProvider.tsx';
import { XFormDetails } from './components/XForm/XFormDetails.tsx';
import { XFormView } from './components/XForm/XFormView.tsx';
import { XFormDefinition } from './lib/xform/XFormDefinition.ts';
import { XFormEntry } from './lib/xform/XFormEntry.ts';

export const App = () => {
	const [fixture, setFixture] = createSignal<SelectedDemoFixture | null>(null);
	// A resource (Solid's mechanism for data fetching and triggering Suspense) is a
	// likely way we'll fetch forms, so using it here to anticipate that rather than
	// importing the fixture directly.
	//
	// TODO: more fixtures are likely incoming rather soon, it'll make sense to have
	// an app entry to correspond to that, and allow selection of particular fixtures,
	// perhaps arbitrary forms as well.
	const [fixtureSourceXML, { refetch }] = createResource(() => {
		return fixture()?.xml ?? null;
	});
	const formInit = createMemo(() => {
		const sourceXML = fixtureSourceXML();

		if (sourceXML == null) {
			return null;
		}

		const definition = new XFormDefinition(sourceXML);
		const entry = untrack(() => new XFormEntry(definition));

		return {
			definition,
			entry,
		};
	});

	createEffect(
		on(fixture, async () => {
			await refetch();
		})
	);

	return (
		<ThemeProvider>
			<Page entry={formInit()?.entry ?? null}>
				<DemoFixturesList setDemoFixture={setFixture} />
				<Suspense fallback={<p>Loading…</p>}>
					<Show when={formInit()} keyed={true}>
						{({ definition, entry }) => {
							return (
								<Stack spacing={4}>
									<Divider />
									<Stack spacing={7}>
										<XFormView entry={entry} />
										<Divider />
										<XFormDetails definition={definition} entry={entry} />
									</Stack>
								</Stack>
							);
						}}
					</Show>
				</Suspense>
			</Page>
		</ThemeProvider>
	);
};
