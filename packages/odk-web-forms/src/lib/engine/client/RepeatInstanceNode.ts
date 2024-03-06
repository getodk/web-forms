import type { RepeatInstanceDefinition } from '../../xform/model/RepeatInstanceDefinition.ts';
import type { BaseNode, BaseNodeState } from './BaseNode.ts';
import type { RepeatRangeNode } from './RepeatRangeNode.ts';
import type { RootNode } from './RootNode.ts';
import type { GeneralChildNode } from './hierarchy.ts';

export interface RepeatInstanceNodeState extends BaseNodeState {
	get hint(): null;
	get children(): readonly GeneralChildNode[];
	get value(): null;
}

export interface RepeatInstanceNode extends BaseNode {
	readonly definition: RepeatInstanceDefinition;
	readonly root: RootNode;
	readonly parent: RepeatRangeNode;
	readonly currentState: RepeatInstanceNodeState;
}
