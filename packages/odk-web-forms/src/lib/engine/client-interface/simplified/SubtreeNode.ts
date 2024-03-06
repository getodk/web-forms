import type { SubtreeDefinition } from '../../../xform/model/SubtreeDefinition.ts';
import type { BaseNode, BaseNodeState } from './BaseNode.ts';
import type { RootNode } from './RootNode.ts';
import type { GeneralChildNode, GeneralParentNode } from './hierarchy.ts';

export interface SubtreeNodeState extends BaseNodeState {
	get hint(): null;
	get children(): readonly GeneralChildNode[];
	get value(): null;
}

export interface SubtreeNode extends BaseNode {
	readonly definition: SubtreeDefinition;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;
	readonly currentState: SubtreeNodeState;
}
