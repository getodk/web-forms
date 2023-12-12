import { useNavigate } from '@solidjs/router';
import type { JSX } from 'solid-js';
import {
	createEffect,
	createMemo,
	createSignal,
	getOwner,
	onMount,
	runWithOwner,
	useContext,
} from 'solid-js';
import CloudUpload from 'suid/icons-material/CloudUpload';
import { Box, Button, CircularProgress, Icon, Stack, Typography, styled } from 'suid/material';
import { DemoContext, type DemoContextState } from './DemoContext.tsx';
import { UPLOADED_FORM_PATH } from './UploadedForm.tsx';

export interface FormUploadResult {
	readonly file: File;
	readonly xformXML: string;
}

const uploadFile = async (demoContext: DemoContextState, file: File) => {
	const owner = getOwner();

	demoContext.setUploadInProgress();

	const xformXML = await readFileText(file);

	runWithOwner(owner, () => {
		demoContext.uploadForm({
			file,
			xformXML,
		});
	});
};

const readFileText = async (file: File): Promise<string> => {
	const fileReader = new FileReader();

	let resolveFn!: (value: string) => void;
	let rejectFn!: (reason: unknown) => void;

	const promise = new Promise<string>((resolve, reject) => {
		resolveFn = resolve;
		rejectFn = reject;
	});

	const onProgress = () => {
		if (fileReader.readyState === FileReader.DONE) {
			const { error, result } = fileReader;

			if (typeof result === 'string') {
				resolveFn(result);
			} else {
				rejectFn(error);
			}

			cleanup();
		}
	};

	const cleanup = () => {
		fileReader.removeEventListener('load', onProgress);
		fileReader.removeEventListener('error', onProgress);
	};

	fileReader.addEventListener('load', onProgress);
	fileReader.addEventListener('error', onProgress);

	await new Promise<void>((resolve) => {
		setTimeout(resolve, 10);
	});

	fileReader.readAsText(file);

	return promise;
};

const FormUploaderFileInputButton = styled(Button)(({ theme }) => ({
	padding: 0,
	fontSize: 'inherit',
	fontWeight: 'inherit',
	textDecoration: 'underline',
	textTransform: 'none',
	color: 'inherit',
	backgroundColor: 'transparent',
	verticalAlign: 'baseline',

	'&:hover': {
		color: theme.palette.primary.main,
		backgroundColor: 'transparent',
	},
}));

const VisuallyHiddenInput = styled('input')({
	clip: 'rect(0 0 0 0)',
	clipPath: 'inset(50%)',
	height: 1,
	overflow: 'hidden',
	position: 'absolute',
	bottom: 0,
	left: 0,
	whiteSpace: 'nowrap',
	width: 1,
});

interface FormUploaderFileInputProps {
	readonly children: JSX.Element;
}

const FormUploaderFileInput = (props: FormUploaderFileInputProps) => {
	const demoContext = useContext(DemoContext);

	return (
		<FormUploaderFileInputButton component="label" variant="text">
			{props.children}
			<VisuallyHiddenInput
				type="file"
				onChange={(event) => {
					const [file] = event.target.files ?? [];

					if (file == null) {
						demoContext.reset();
					} else {
						void uploadFile(demoContext, file);
					}
				}}
			/>
		</FormUploaderFileInputButton>
	);
};

interface DropTargetProps {
	readonly class?: string;
	readonly isTarget: boolean;
	readonly children: JSX.Element;
}

const BaseDropTarget = (props: DropTargetProps) => {
	return (
		<Stack
			class={props.class ?? ''}
			direction="column"
			spacing={2}
			alignItems="center"
			justifyContent="center"
		>
			{props.children}
		</Stack>
	);
};

const DropTarget = styled(BaseDropTarget)(({ props, theme }) => ({
	padding: '2rem',
	borderWidth: '2px',
	borderStyle: props.isTarget ? 'solid' : 'dashed',
	borderColor: props.isTarget ? theme.palette.primary.light : theme.palette.grey[600],
	borderRadius: theme.shape.borderRadius * 2,
	color: props.isTarget ? theme.palette.primary.main : '',
	backgroundColor: props.isTarget ? theme.palette.primaryShades!['10%'] : theme.palette.grey[100],
}));

interface BaseUploadTargetProps {
	readonly children: JSX.Element;
}

const BaseUploadTarget = (props: BaseUploadTargetProps) => {
	const demoContext = useContext(DemoContext);
	const [isDropTarget, setIsDropTarget] = createSignal(false);

	const handleDrag = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();

		setIsDropTarget(() => {
			return event.type === 'dragenter' || event.type === 'dragover';
		});

		if (event.type === 'drop') {
			const [file] = event.dataTransfer?.files ?? [];

			if (file == null) {
				demoContext.reset();
			} else {
				void uploadFile(demoContext, file);
			}
		}
	};

	onMount(() => {
		demoContext.reset();
	});

	return (
		<Box
			classList={{ 'drop-target': isDropTarget() }}
			onDragEnter={handleDrag}
			onDragLeave={handleDrag}
			onDragOver={handleDrag}
			onDrop={handleDrag}
		>
			<DropTarget isTarget={isDropTarget()}>{props.children}</DropTarget>
		</Box>
	);
};

const UploadTarget = styled(BaseUploadTarget)({
	'&.drop-target': {
		backgroundColor: '#f00',
	},
});

export const FormUploader = () => {
	const demoContext = useContext(DemoContext);
	const navigate = useNavigate();
	const progressIcon = <CircularProgress size={36} />;
	const uploadIcon = createMemo(() => {
		if (demoContext.isUploadInProgress()) {
			return progressIcon;
		}

		return <CloudUpload fontSize="large" />;
	});

	createEffect<FormUploadResult | null>((previous) => {
		const current = demoContext.formUpload();

		if (current != null && current !== previous) {
			navigate(UPLOADED_FORM_PATH);
		}

		return current;
	}, null);

	return (
		<Stack spacing={2}>
			<Typography variant="h2">… or choose another form</Typography>
			<UploadTarget>
				<Icon fontSize="large">{uploadIcon()}</Icon>
				<Stack alignItems="center">
					<Typography variant="body2">
						Drag and drop or <FormUploaderFileInput>choose</FormUploaderFileInput> a form
					</Typography>
				</Stack>
			</UploadTarget>
		</Stack>
	);
};
