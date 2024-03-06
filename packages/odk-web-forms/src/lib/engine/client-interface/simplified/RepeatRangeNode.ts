import type { RepeatSequenceDefinition } from '../../../xform/model/RepeatSequenceDefinition.ts';
import type { BaseNode, BaseNodeState } from './BaseNode.ts';
import type { RepeatInstanceNode } from './RepeatInstanceNode.ts';
import type { RootNode } from './RootNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';

export interface RepeatRangeNodeState extends BaseNodeState {
	get hint(): null;
	get label(): null;
	get children(): readonly RepeatInstanceNode[];
	get value(): null;
}

export interface RepeatRangeNode extends BaseNode {
	readonly definition: RepeatSequenceDefinition;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;
	readonly currentState: RepeatRangeNodeState;

	addInstances(afterIndex?: number, count?: number): RootNode;

	removeInstances(startIndex: number, count?: number): RootNode;
}
