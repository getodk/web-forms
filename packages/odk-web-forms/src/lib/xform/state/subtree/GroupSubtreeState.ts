import type { GroupSubtreeDefinition } from '../../model/subtree/GroupSubtreeDefinition.ts';
import type { EntryState } from '../EntryState.ts';
import type { AnyParentState } from '../NodeState.ts';
import { SubtreeState } from './SubtreeState.ts';

export class GroupSubtreeState extends SubtreeState<'group'> {
	override readonly subtreeType = 'group';

	constructor(entry: EntryState, parent: AnyParentState, definition: GroupSubtreeDefinition) {
		super(entry, parent, definition);
	}
}
