import { For, Show, createMemo } from 'solid-js';
import type { XFormEntry } from '../../lib/xform/XFormEntry';
import type { XFormEntryBinding } from '../../lib/xform/XFormEntryBinding';
import type { XFormViewLabel } from '../../lib/xform/XFormViewLabel';
import { DefaultLabel } from '../styled/DefaultLabel';
import { DefaultLabelRequiredIndicator } from '../styled/DefaultLabelRequiredIndicator';

export interface XFormLabelProps {
	readonly as?: 'span';
	readonly binding: XFormEntryBinding;
	readonly entry: XFormEntry;
	readonly id: string;
	readonly label: XFormViewLabel;
}

export const XFormLabel = (props: XFormLabelProps) => {
	const labelParts = createMemo(() => {
		return props.label.parts.map((part) => part.evaluate(props.binding));
	});

	return (
		<>
			<Show when={props.binding.isRequired()}>
				<DefaultLabelRequiredIndicator>* </DefaultLabelRequiredIndicator>
			</Show>
			<DefaultLabel as={props.as ?? 'label'} for={props.id}>
				<For each={labelParts()}>{(part) => part}</For>
			</DefaultLabel>
		</>
	);
};
