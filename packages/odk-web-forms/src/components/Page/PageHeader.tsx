import { Stack } from 'suid/material';
import type { XFormEntry } from '../../lib/xform/XFormEntry.ts';
import { FormLanguageMenu } from '../FormLanguageMenu.tsx';

interface PageHeaderProps {
	readonly entry: XFormEntry | null;
}

export const PageHeader = (props: PageHeaderProps) => {
	return (
		<Stack direction="row" justifyContent="flex-end">
			<FormLanguageMenu entry={props.entry} />
		</Stack>
	);
};
