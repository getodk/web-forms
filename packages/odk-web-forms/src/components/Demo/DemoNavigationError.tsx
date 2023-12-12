import { Alert, AlertTitle } from 'suid/material';

export class NavigationError extends Error {
	constructor(
		readonly url: string,
		message: string
	) {
		super(message);
	}
}

interface DemoNavigationErrorProps {
	readonly error: NavigationError;
}

export const DemoNavigationError = (props: DemoNavigationErrorProps) => {
	return (
		<Alert severity="error">
			<AlertTitle>Navigation Error</AlertTitle>
			<p>
				Failed to load url: <code>{props.error.url}</code>
			</p>
			<p>{props.error.message}</p>
		</Alert>
	);
};
