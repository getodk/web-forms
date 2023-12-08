import type { InputDefinition } from '../../body/control/InputDefinition.ts';
import type { BindDefinition } from '../BindDefinition.ts';
import type { ParentNodeDefinition } from '../NodeDefinition.ts';
import { ValueNodeDefinition } from './ValueNodeDefinition.ts';

export class InputValueNodeDefinition extends ValueNodeDefinition<'input'> {
	override readonly valueType = 'input';

	constructor(
		parent: ParentNodeDefinition,
		bind: BindDefinition,
		override readonly bodyElement: InputDefinition,
		node: Element
	) {
		super(parent, bind, bodyElement, node);
	}
}
