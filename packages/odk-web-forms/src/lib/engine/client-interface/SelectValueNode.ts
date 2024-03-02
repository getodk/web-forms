import type { ValueNode, ValueNodeState } from './ValueNode.ts';
import type { TextRange } from './text/TextRange.ts';

interface SelectItem {
	get value(): string;
	get label(): TextRange<'label'> | null;
}

export interface SelectValueNodeState extends ValueNodeState<SelectItem[]> {
	get items(): readonly SelectItem[];
}

/**
 * The web-forms engine's representation of a {@link ValueNode} corresponding
 * to an XForms `<select>` or `<select1>`.
 */
export interface SelectValueNode extends ValueNode<SelectItem[], SelectValueNodeState> {
	// TODO: for consideration, select-specific setters...? e.g.
	//
	// - Additive (<select>) or maybe not (?, <select1>):
	//
	// select(item: SelectItem): RootNode;
	//
	// - Removal:
	//
	// deselect(item: SelectItem): RootNode;
}
