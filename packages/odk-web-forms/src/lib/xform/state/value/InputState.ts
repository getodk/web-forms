import type { InputDefinition } from '../../body/control/InputDefinition.ts';
import type { InputValueNodeDefinition } from '../../model/value-node/InputValueNodeDefinition.ts';
import type { EntryState } from '../EntryState.ts';
import type { AnyParentState } from '../NodeState.ts';
import { ValueState } from './ValueState.ts';

export class InputState extends ValueState<'input'> {
	override readonly valueType = 'input';
	override readonly bodyElement: InputDefinition;

	constructor(entry: EntryState, parent: AnyParentState, definition: InputValueNodeDefinition) {
		super(entry, parent, definition);

		this.bodyElement = definition.bodyElement;
	}
}
