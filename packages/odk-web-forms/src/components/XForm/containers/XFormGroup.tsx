import { Match, Show, Switch, createMemo, createSignal } from 'solid-js';
import type { RepeatSequenceState } from '../../../lib/xform/state/RepeatSequenceState.ts';
import type { GroupSubtreeState } from '../../../lib/xform/state/subtree/GroupSubtreeState.ts';
import { NestedGroupBox } from '../../styled/NestedGroupBox.tsx';
import { XFormQuestionList } from '../XFormQuestionList.tsx';
import { XFormRelevanceGuard } from '../XFormRelevanceGuard.tsx';
import { XFormGroupLabel } from './XFormGroupLabel.tsx';
import { XFormRepeatList } from './XFormRepeatList.tsx';

export type GroupLikeState = GroupSubtreeState | RepeatSequenceState;

export interface XFormGroupProps {
	readonly state: GroupLikeState;
}

const repeatState = (state: GroupLikeState): RepeatSequenceState | null => {
	if (state.type === 'repeat-sequence') {
		return state;
	}

	return null;
};

const nonRepeatState = (state: GroupLikeState): GroupSubtreeState | null => {
	if (state.type === 'repeat-sequence') {
		return null;
	}

	return state;
};

export const XFormGroup = (props: XFormGroupProps) => {
	const element = () => props.state.definition.bodyElement;
	const isRelevant = createMemo(() => {
		return props.state.isRelevant();
	});
	const [isGroupVisible, setGroupVisible] = createSignal(true);

	return (
		<XFormRelevanceGuard isRelevant={isRelevant()}>
			<div class="xform-group" data-reference={props.state.reference}>
				<Show when={element()?.type !== 'repeat-group' && element()?.label} keyed={true}>
					{(label) => (
						<XFormGroupLabel
							state={props.state}
							label={label}
							isGroupVisible={isGroupVisible()}
							setGroupVisible={setGroupVisible}
						/>
					)}
				</Show>
				<Show when={isGroupVisible()}>
					<Switch>
						<Match when={repeatState(props.state)} keyed={true}>
							{(state) => {
								return <XFormRepeatList state={state} />;
							}}
						</Match>
						<Match when={nonRepeatState(props.state)} keyed={true}>
							{(state) => {
								return (
									<NestedGroupBox as="section">
										<XFormQuestionList state={state} />
									</NestedGroupBox>
								);
							}}
						</Match>
					</Switch>
				</Show>
			</div>
		</XFormRelevanceGuard>
	);
};
