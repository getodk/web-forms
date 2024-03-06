import type { ValueNodeDefinition } from '../../xform/model/ValueNodeDefinition.ts';
import type { BaseNode, BaseNodeState } from './BaseNode.ts';
import type { RootNode } from './RootNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';

export interface StringNodeState extends BaseNodeState {
	get children(): null;
	get value(): string;
}

export interface StringNode extends BaseNode {
	readonly definition: ValueNodeDefinition;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;

	setValue(value: string): RootNode;
}
