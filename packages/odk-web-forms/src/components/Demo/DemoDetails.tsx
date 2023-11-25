import { Show } from 'solid-js';
import InfoOutlined from 'suid/icons-material/InfoOutlined';
import { Box, Icon, Paper, Stack, Typography, styled } from 'suid/material';
import type { EntryState } from '../../lib/xform/state/EntryState.ts';
import { ElementTree } from '../Demo/ElementTree.tsx';
import { ObjectTree } from '../Demo/ObjectTree.tsx';

export const DetailsContainer = styled(Paper)(({ theme }) => ({
	borderRadius: theme.shape.borderRadius * 4,
	padding: theme.spacing(3),
	marginBlockEnd: theme.spacing(2),
}));

const DetailsIcon = styled(Icon)({
	color: '#2d9dbd',
});

const DetailsHeading = styled(Typography)({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	gap: '0.5rem',
	fontSize: '1.25rem',
	fontWeight: 'normal',
	margin: '0 0 1rem',
});

const DetailsSubheading = styled(Typography)({
	fontSize: '1rem',
	fontWeight: 'bold',
	margin: '0 0 0.5rem',
});

const Code = styled('code')({
	display: 'inline-block',
	padding: '0.125em',
	borderRadius: '3px',
	fontWeight: 'normal',
	color: '#111',
	backgroundColor: '#eee',
});

export interface DemoDetailsProps {
	readonly entry: EntryState | null;
}

export const DemoDetails = (props: DemoDetailsProps) => {
	return (
		<Show when={props.entry} keyed={true}>
			{(entry) => {
				return (
					<DetailsContainer elevation={1}>
						<DetailsHeading variant="h1">
							<DetailsIcon>
								<InfoOutlined />
							</DetailsIcon>
							Form Details
						</DetailsHeading>
						<Stack spacing={4}>
							<Box>
								<DetailsSubheading variant="h2">Submission state (XML DOM)</DetailsSubheading>
								<ElementTree element={entry.instanceState()} />
							</Box>
							<Box>
								<DetailsSubheading variant="h2">
									<Code>XFormDefinition</Code> (in-memory representation)
								</DetailsSubheading>
								<ObjectTree value={entry.form.toJSON()} />
							</Box>
							<Box>
								<DetailsSubheading variant="h2">XForm definition (XML input)</DetailsSubheading>
								<ElementTree element={entry.form.xformDocument.documentElement} />
							</Box>
						</Stack>
					</DetailsContainer>
				);
			}}
		</Show>
	);
};
