import { useLocation, useSearchParams } from '@solidjs/router';
import { Match, Show, Suspense, Switch, createResource } from 'solid-js';
import { localURL } from '../../lib/url.ts';
import { DemoFormEntry } from './DemoFormEntry.tsx';
import { DemoNavigationError, NavigationError } from './DemoNavigationError.tsx';

export const DEMO_FORM_BASE_PATH = '/demo-form/';

export const demoFormURL = (fixturePath: string): string => {
	return localURL({
		path: DEMO_FORM_BASE_PATH,
		query: { fixturePath },
	});
};

interface FixtureResource {
	readonly responseBody?: string;
	readonly navigationError?: NavigationError;
}

export const DemoForm = () => {
	const [searchParams] = useSearchParams();
	const location = useLocation();
	const [fixture] = createResource<FixtureResource>(async () => {
		const path = searchParams.fixturePath;

		if (path == null) {
			const url = localURL({
				path: location.pathname,
				query: location.query,
			});

			return {
				navigationError: new NavigationError(url, 'No fixture path specified'),
			};
		}

		const fixtureResponse = await fetch(path);
		const responseBody = await fixtureResponse.text();

		return { responseBody };
	});

	return (
		<>
			<Suspense fallback={<p>Loading…</p>}>
				<Show when={fixture()} keyed={true}>
					{({ navigationError, responseBody }) => {
						return (
							<Switch>
								<Match when={navigationError} keyed={true}>
									{(error) => <DemoNavigationError error={error} />}
								</Match>
								<Match when={responseBody} keyed={true}>
									{(xformXML) => <DemoFormEntry xformXML={xformXML} />}
								</Match>
							</Switch>
						);
					}}
				</Show>
			</Suspense>
		</>
	);
};
