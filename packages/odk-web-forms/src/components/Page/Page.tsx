import { type JSX } from 'solid-js';
import { GlobalStyles, Stack, styled, useTheme } from 'suid/material';
import { PageContainer } from '../styled/PageContainer.tsx';
import { PageFooter } from './PageFooter.tsx';
import { PageHeader } from './PageHeader.tsx';
import { PageMain } from './PageMain.tsx';

const PageStack = styled(Stack)(({ theme }) => ({
	paddingBlock: theme.spacing(2),
}));

interface PageProps {
	readonly children?: JSX.Element;
	readonly details?: JSX.Element;
}

export const Page = (props: PageProps) => {
	const theme = useTheme();

	return (
		<>
			<GlobalStyles
				styles={{
					'html, body': {
						fontFamily: 'sans-serif',
					},

					'html, body, #root, #root > .MuiContainer-root': {
						display: 'block',
						position: 'relative',
						height: '100%',
						backgroundColor: `var(--page-background, ${theme.palette.background.default})`,
					},

					'html, body, #root': {
						width: '100%',
						margin: '0',
						padding: '0',
					},
				}}
			/>
			<PageContainer>
				<PageStack spacing={2}>
					<PageHeader />
					<PageMain elevation={2}>{props.children}</PageMain>
					<PageFooter />
					{props.details}
				</PageStack>
			</PageContainer>
		</>
	);
};
