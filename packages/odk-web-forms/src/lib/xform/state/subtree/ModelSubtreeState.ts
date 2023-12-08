import type { ModelSubtreeDefinition } from '../../model/subtree/ModelSubtreeDefinition.ts';
import type { EntryState } from '../EntryState.ts';
import type { AnyParentState } from '../NodeState.ts';
import { SubtreeState } from './SubtreeState.ts';

export class ModelSubtreeState extends SubtreeState<'model'> {
	override readonly subtreeType = 'model';

	constructor(entry: EntryState, parent: AnyParentState, definition: ModelSubtreeDefinition) {
		super(entry, parent, definition);
	}
}
