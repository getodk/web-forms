import { type JSX } from 'solid-js';
import { Page } from './components/Page/Page.tsx';
import { ThemeProvider } from './components/ThemeProvider.tsx';

interface AppProps {
	readonly children?: JSX.Element;
}

export const App = (props: AppProps) => {
	return (
		<ThemeProvider>
			<Page>{props.children}</Page>
		</ThemeProvider>
	);
};
