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
import { DemoDetails } from './components/Demo/DemoDetails.tsx';
import { DemoFixturesList, type SelectedDemoFixture } from './components/Demo/DemoFixturesList.tsx';
import { LocalizationProvider } from './components/LocalizationProvider.tsx';
import { Page } from './components/Page/Page.tsx';
import { ThemeProvider } from './components/ThemeProvider.tsx';
import { XFormView } from './components/XForm/XFormView.tsx';
import type { Localization } from './lib/i18n-l10n/types.ts';
import { XFormDefinition } from './lib/xform/XFormDefinition.ts';
import { EntryState } from './lib/xform/state/EntryState.ts';

// TODO: this is just to populate the menu for now
const localizations: readonly Localization[] = [
	{
		locale: 'en-us',
		name: 'English (US)',
	},
	{
		locale: 'es',
		name: 'Spanish',
	},
];

export const App = () => {
	const [fixture, setFixture] = createSignal<SelectedDemoFixture | null>(null);
	// A resource (Solid's mechanism for data fetching and triggering Suspense) is a
	// likely way we'll fetch forms, so using it here to anticipate that rather than
	// importing the fixture directly.
	//
	// TODO: more fixtures are likely incoming rather soon, it'll make sense to have
	// an app entry to correspond to that, and allow selection of particular fixtures,
	// perhaps arbitrary forms as well.
	const [fixtureSourceXML, { refetch }] = createResource(async () => {
		return await Promise.resolve(fixture()?.xml);
	});

	const formEntry = createMemo(() => {
		const sourceXML = fixtureSourceXML();

		if (sourceXML == null) {
			return null;
		}

		const definition = new XFormDefinition(sourceXML);

		return untrack(() => new EntryState(definition));
	});

	createEffect(
		on(fixture, async () => {
			await refetch();
		})
	);

	return (
		<ThemeProvider>
			<LocalizationProvider localizations={localizations}>
				<Suspense>
					<Page details={<DemoDetails entry={formEntry()} />}>
						<DemoFixturesList setDemoFixture={setFixture} />
						<Show when={formEntry()} keyed={true}>
							{(entry) => {
								return <XFormView entry={entry} />;
							}}
						</Show>
					</Page>
				</Suspense>
			</LocalizationProvider>
		</ThemeProvider>
	);
};
