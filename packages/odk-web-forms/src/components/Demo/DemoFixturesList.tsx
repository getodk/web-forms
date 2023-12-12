import { XHTML_NAMESPACE_URI } from '@odk/common/constants/xmlns';
import { For, createMemo } from 'solid-js';
import Assignment from 'suid/icons-material/Assignment';
import {
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Stack,
	Typography,
	styled,
} from 'suid/material';
import { demoFormURL } from './DemoForm.tsx';

const DemoFixtureListItem = styled(ListItem)({
	padding: 0,
});

const DemoFixtureListItemIcon = styled(ListItemIcon)({
	minWidth: '2.5rem',
});

const formFixtureGlobImports = import.meta.glob('../../../fixtures/xforms/**/*.xml', {
	as: 'raw',
	eager: true,
});

export interface SelectedDemoFixture {
	readonly key: string;
	readonly name: string;
	readonly title: string;
	readonly url: string;
	readonly path: string;
	readonly xml: string;
}

const domParser = new DOMParser();

export const DemoFixturesList = () => {
	const getFixtures = createMemo(() => {
		const baseEntries = Object.entries(formFixtureGlobImports);

		const entries = baseEntries.map(([key, xml]): readonly [string, SelectedDemoFixture] => {
			const name = key.replace(/^.*\/([^/]+)$/, '$1');
			const url = import.meta.resolve(key, import.meta.url);
			const path = url.replace(window.location.origin, '');
			const parsed: XMLDocument = domParser.parseFromString(xml, 'text/xml');
			const title =
				parsed.getElementsByTagNameNS(XHTML_NAMESPACE_URI, 'title')[0]?.textContent ?? name;

			return [
				key,
				{
					key,
					name,
					title,
					url,
					path,
					xml,
				} as const,
			];
		});

		return new Map(entries);
	});

	const isDemoFixture = (fixtureKey: string) => fixtureKey.includes('/all-hands/'); //||
	// fixtureKey.includes('/computations-demo/') ||
	// fixtureKey.includes('/repeats/') ||
	// fixtureKey.includes('/itext/') ||
	// fixtureKey.includes('/select/') ||
	// fixtureKey.includes('/smoke-tests/');
	const demoFixtures = createMemo(() =>
		Array.from(getFixtures().values()).filter(({ key }) => isDemoFixture(key))
	);

	return (
		<Stack spacing={2}>
			<Typography variant="h1">Choose a demo form</Typography>
			<List>
				<For each={demoFixtures()}>
					{(fixture) => (
						<DemoFixtureListItem>
							<ListItemButton component="a" href={demoFormURL(fixture.path)}>
								<DemoFixtureListItemIcon>
									<Assignment />
								</DemoFixtureListItemIcon>
								<ListItemText>{fixture.title}</ListItemText>
							</ListItemButton>
						</DemoFixtureListItem>
					)}
				</For>
			</List>
		</Stack>
	);
};
