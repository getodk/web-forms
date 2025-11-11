import type { InputValue } from '@getodk/xforms-engine';
import type { AttributeNode } from '../../../xforms-engine/dist/client/AttributeNode';
import { ValueNodeAnswer } from './ValueNodeAnswer.ts';

export class AttributeNodeAnswer extends ValueNodeAnswer<
	AttributeNode
> {
	readonly valueType = 'attribute';
	readonly stringValue: string;
	readonly value: InputValue<V>;

	constructor(node: AttributeNode) {
		super(node);
		this.stringValue = node.value;
		this.value = node.value;
	}
}
