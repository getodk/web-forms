import { RepeatElementDefinition } from '../body/RepeatElementDefinition.ts';
import { DescendentNodeDefinition } from './DescendentNodeDefinition.ts';
import type { ChildNodeDefinition, NodeDefinition } from './NodeDefinition.ts';
import type { RepeatSequenceDefinition } from './RepeatSequenceDefinition.ts';

export class RepeatInstanceDefinition
	extends DescendentNodeDefinition<'repeat-instance', RepeatElementDefinition>
	implements NodeDefinition<'repeat-instance'>
{
	readonly type = 'repeat-instance';

	readonly nodeName: string;
	readonly children: readonly ChildNodeDefinition[];
	readonly instances = null;
	readonly defaultValue = null;

	constructor(
		protected readonly sequence: RepeatSequenceDefinition,
		readonly node: Element
	) {
		const { bind, bodyElement, parent, root } = sequence;

		super(parent, bind, bodyElement);

		this.nodeName = sequence.nodeName;
		this.children = root.buildSubtree(this);
	}

	toJSON() {
		const { bind, bodyElement, parent, root, sequence, ...rest } = this;

		return rest;
	}
}
