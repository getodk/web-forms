import { Show } from 'solid-js';
import type { InputState } from '../../../lib/xform/state/value/InputState.ts';
import { TextWidget } from '../../Widget/TextWidget.tsx';
import { XFormUnlabeledControl } from '../debugging/XFormUnlabeledInputControl.tsx';

interface XFormInputControlProps {
	readonly state: InputState;
}

export const XFormInputControl = (props: XFormInputControlProps) => {
	return (
		<>
			<Show when={props.state.bodyElement.label == null}>
				<XFormUnlabeledControl control={props.state.bodyElement} />
			</Show>
			<TextWidget state={props.state} />
		</>
	);
};
