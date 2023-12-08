import type { AnySelectDefinition } from '../../body/control/select/SelectDefinition.ts';
import type { BindDefinition } from '../BindDefinition.ts';
import type { ParentNodeDefinition } from '../NodeDefinition.ts';
import { ValueNodeDefinition } from './ValueNodeDefinition.ts';

export class SelectValueNodeDefinition extends ValueNodeDefinition<'select'> {
	override readonly valueType = 'select';

	constructor(
		parent: ParentNodeDefinition,
		bind: BindDefinition,
		override readonly bodyElement: AnySelectDefinition,
		node: Element
	) {
		super(parent, bind, bodyElement, node);
	}
}
