import type { AnySelectDefinition } from '../../body/control/select/SelectDefinition.ts';
import type { SelectValueNodeDefinition } from '../../model/value-node/SelectValueNodeDefinition.ts';
import type { EntryState } from '../EntryState.ts';
import type { AnyParentState } from '../NodeState.ts';
import { ValueState } from './ValueState.ts';

export class SelectState extends ValueState<'select'> {
	override readonly valueType = 'select';
	override readonly bodyElement: AnySelectDefinition;

	constructor(entry: EntryState, parent: AnyParentState, definition: SelectValueNodeDefinition) {
		super(entry, parent, definition);

		this.bodyElement = definition.bodyElement;
	}
}
