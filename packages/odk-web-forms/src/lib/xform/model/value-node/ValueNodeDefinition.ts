import type { AnyControlDefinition } from '../../body/control/ControlDefinition.ts';
import type { BindDefinition } from '../BindDefinition.ts';
import { DescendentNodeDefinition } from '../DescendentNodeDefinition.ts';
import type { NodeDefinition, ParentNodeDefinition } from '../NodeDefinition.ts';
import type { InputValueNodeDefinition } from './InputValueNodeDefinition.ts';
import type { ModelValueNodeDefinition } from './ModelValueNodeDefinition.ts';
import type { SelectValueNodeDefinition } from './SelectValueNodeDefinition.ts';

export type ValueNodeType = 'input' | 'model' | 'select';

export abstract class ValueNodeDefinition<ValueType extends ValueNodeType>
	extends DescendentNodeDefinition<'value-node', AnyControlDefinition | null>
	implements NodeDefinition<'value-node'>
{
	readonly type = 'value-node';

	abstract readonly valueType: ValueType;

	readonly nodeName: string;
	readonly children = null;
	readonly instances = null;
	readonly defaultValue: string;

	constructor(
		parent: ParentNodeDefinition,
		bind: BindDefinition,
		bodyElement: AnyControlDefinition | null,
		readonly node: Element
	) {
		super(parent, bind, bodyElement);

		this.nodeName = node.localName;
		this.defaultValue = node.textContent ?? '';
	}

	toJSON() {
		const { bind, bodyElement, parent, root, ...rest } = this;

		return rest;
	}
}

// prettier-ignore
export type AnyValueNodeDefinition =
	| InputValueNodeDefinition
	| ModelValueNodeDefinition
	| SelectValueNodeDefinition;

export type TypedValueNodeDefinition<ValueType extends ValueNodeType> = Extract<
	AnyValueNodeDefinition,
	{ readonly valueType: ValueType }
>;
