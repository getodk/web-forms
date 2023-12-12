import { Stack } from 'suid/material';
import { DemoFixturesList } from './DemoFixturesList.tsx';
import { FormUploader } from './FormUploader.tsx';

export const DEMO_ROOT_PATH = '/';

export const DemoRoot = () => {
	return (
		<Stack spacing={4}>
			<DemoFixturesList />
			<FormUploader />
		</Stack>
	);
};
