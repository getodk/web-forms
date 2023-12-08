import { Show, createMemo } from 'solid-js';
import type { InputState } from '../../lib/xform/state/value/InputState.ts';
import { XFormControlLabel } from '../XForm/controls/XFormControlLabel.tsx';
import { DefaultTextField } from '../styled/DefaultTextField.tsx';
import { DefaultTextFormControl } from '../styled/DefaultTextFormControl.tsx';

export interface TextWidgetProps {
	readonly state: InputState;
}

export const TextWidget = (props: TextWidgetProps) => {
	const isDisabled = createMemo(() => {
		return props.state.isReadonly() === true || props.state.isRelevant() === false;
	});

	return (
		<DefaultTextFormControl fullWidth={true}>
			<Show when={props.state.bodyElement.label} keyed={true}>
				{(label) => {
					return <XFormControlLabel state={props.state} label={label} />;
				}}
			</Show>
			<DefaultTextField
				id={props.state.reference}
				value={props.state.getValue()}
				onChange={(event) => {
					props.state.setValue(event.target.value);
				}}
				disabled={isDisabled()}
				inputProps={{
					disabled: isDisabled(),
					readonly: isDisabled(),
					required: props.state.isRequired() ?? false,
				}}
			/>
		</DefaultTextFormControl>
	);
};
