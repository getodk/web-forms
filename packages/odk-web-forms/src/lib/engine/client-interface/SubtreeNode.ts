import type { SubtreeDefinition } from '../../xform/model/SubtreeDefinition.ts';
import type { DescendantNode } from './DescendantNode.ts';
import type { FormNodeState } from './FormNodeState.ts';
import type { AnyParentNode, ParentNode } from './ParentNode.ts';
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- referenced in JSDoc
import type { RootNode } from './RootNode.ts';

/**
 * A node which is both a parent to other nodes ({@link ParentNode}) as well as
 * the descendant of another parent ({@link DescendantNode}). Represents all
 * parent nodes in the web-forms engine's representation, except for the
 * {@link RootNode}.
 */
export interface SubtreeNode<SubtreeState extends FormNodeState = FormNodeState>
	extends DescendantNode<SubtreeDefinition, SubtreeState>,
		ParentNode<SubtreeDefinition, SubtreeState> {
	readonly parent: AnyParentNode;
}
