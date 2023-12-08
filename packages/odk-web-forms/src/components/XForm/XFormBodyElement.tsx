import { Match, Switch } from 'solid-js';
import { type AnyBodyElementDefinition } from '../../lib/xform/body/BodyDefinition.ts';
import type { AnyChildState } from '../../lib/xform/state/NodeState.ts';
import type { ValueNodeState } from '../../lib/xform/state/ValueNodeState.ts';
import { XFormGroup, type GroupLikeState } from './containers/XFormGroup.tsx';
import { XFormControl } from './controls/XFormControl.tsx';

interface XFormUnknownElementProps {
	readonly state: AnyChildState;
	readonly element: AnyBodyElementDefinition;
}

const XFormUnknownElement = (props: XFormUnknownElementProps) => {
	props;
	return <></>;
};

const groupState = (props: XFormBodyElementProps): GroupLikeState | null => {
	const { state } = props;

	if (
		state.type === 'repeat-sequence' ||
		(state.type === 'subtree' && state.subtreeType === 'group')
	) {
		return state;
	}

	return null;
};

const controlState = (props: XFormBodyElementProps): ValueNodeState | null => {
	const { state } = props;

	if (state.type === 'value-node') {
		return state;
	}

	return null;
};

export interface XFormBodyElementProps {
	readonly state: AnyChildState;
	readonly element: AnyBodyElementDefinition;
}

export const XFormBodyElement = (props: XFormBodyElementProps) => {
	return (
		<Switch fallback={<XFormUnknownElement {...props} />}>
			<Match when={groupState(props)} keyed={true}>
				{(state) => <XFormGroup state={state} />}
			</Match>
			<Match when={controlState(props)} keyed={true}>
				{(state) => {
					return <XFormControl state={state} />;
				}}
			</Match>
		</Switch>
	);
};
