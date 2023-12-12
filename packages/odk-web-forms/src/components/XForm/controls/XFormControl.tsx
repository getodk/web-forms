import { Match, Switch, createMemo } from 'solid-js';
import type { SelectState } from '../../../lib/xform/state/select/SelectState.ts';
import type { InputState } from '../../../lib/xform/state/value/InputState.ts';
import type { ControlState } from '../../../lib/xform/state/value/ValueState.ts';
import { XFormRelevanceGuard } from '../XFormRelevanceGuard.tsx';
import { XFormUnknownControl } from '../debugging/XFormUnknownControl.tsx';
import { SelectControl } from './SelectControl.tsx';
import { XFormInputControl } from './XFormInputControl.tsx';

export interface XFormControlProps {
	readonly state: ControlState;
}

const inputState = (props: XFormControlProps): InputState | null => {
	const { state } = props;

	return state.valueType === 'input' ? state : null;
};

const selectState = (props: XFormControlProps): SelectState | null => {
	const { state } = props;

	return state.valueType === 'select' ? state : null;
};

export const XFormControl = (props: XFormControlProps) => {
	const isRelevant = createMemo(() => {
		return props.state.isRelevant();
	});

	return (
		<XFormRelevanceGuard isRelevant={isRelevant()}>
			<div class="xform-control" data-reference={props.state.reference}>
				<Switch fallback={<XFormUnknownControl {...props} />}>
					<Match when={inputState(props)} keyed={true}>
						{(state) => {
							return <XFormInputControl state={state} />;
						}}
					</Match>
					<Match when={selectState(props)} keyed={true}>
						{(state) => {
							return <SelectControl state={state} />;
						}}
					</Match>
				</Switch>
			</div>
		</XFormRelevanceGuard>
	);
};
