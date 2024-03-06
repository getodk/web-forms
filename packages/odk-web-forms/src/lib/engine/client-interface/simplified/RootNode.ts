import type { RootDefinition } from '../../../xform/model/RootDefinition.ts';
import type { BaseNode, BaseNodeState } from './BaseNode.ts';
import type { FormLanguage } from './FormLanguage.ts';
import type { GeneralChildNode } from './hierarchy.ts';

export interface RootNodeState extends BaseNodeState {
	get label(): null;
	get hint(): null;
	get children(): readonly GeneralChildNode[];
	get value(): null;
}

export interface RootNode extends BaseNode {
	readonly definition: RootDefinition;
	readonly root: RootNode;
	readonly parent: null;
	readonly currentState: RootNodeState;

	setLanguage(language: FormLanguage): RootNode;
}
