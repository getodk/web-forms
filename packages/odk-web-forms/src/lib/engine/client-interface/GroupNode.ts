import type { FormNodeState } from './FormNodeState.ts';
import type { SubtreeNode } from './SubtreeNode.ts';
import type { TextRange } from './text/TextRange.ts';

interface GroupNodeState extends FormNodeState {
	get label(): TextRange<'label'> | null;
}

/**
 * A {@link SubtreeNode} which corresponds to an XForms <group>.
 *
 * @todo it may not be necessary to distinguish these cases. Consider merging
 * the two. In which case {@link SubtreeNode}'s state should instead allow
 * an optional label.
 */
export interface GroupNode extends SubtreeNode<GroupNodeState> {}
