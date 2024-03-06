import type { ValueNodeDefinition } from '../../../xform/model/ValueNodeDefinition.ts';
import type { TextRange } from '../text/TextRange.ts';
import type { BaseNode, BaseNodeState } from './BaseNode.ts';
import type { RootNode } from './RootNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';

interface SelectItem {
	get value(): string;
	get label(): TextRange<'label'> | null;
}

export interface SelectNodeState extends BaseNodeState {
	get children(): null;
	get value(): readonly SelectItem[];
}

export interface SelectNode extends BaseNode {
	readonly definition: ValueNodeDefinition;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;

	select(item: SelectItem): RootNode;
	deselect(item: SelectItem): RootNode;
}
