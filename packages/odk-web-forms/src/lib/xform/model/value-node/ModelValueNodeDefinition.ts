import type { BindDefinition } from '../BindDefinition.ts';
import type { ParentNodeDefinition } from '../NodeDefinition.ts';
import { ValueNodeDefinition } from './ValueNodeDefinition.ts';

export class ModelValueNodeDefinition extends ValueNodeDefinition<'model'> {
	override readonly valueType = 'model';
	override readonly bodyElement = null;

	constructor(parent: ParentNodeDefinition, bind: BindDefinition, node: Element) {
		super(parent, bind, null, node);
	}
}
