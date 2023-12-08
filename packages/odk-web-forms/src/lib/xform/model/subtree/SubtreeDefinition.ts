import type { NonRepeatGroupElementDefinition } from '../../body/BodyDefinition.ts';
import type { BindDefinition } from '../BindDefinition.ts';
import { DescendentNodeDefinition } from '../DescendentNodeDefinition.ts';
import type {
	ChildNodeDefinition,
	NodeDefinition,
	ParentNodeDefinition,
} from '../NodeDefinition.ts';
import type { GroupSubtreeDefinition } from './GroupSubtreeDefinition.ts';
import type { ModelSubtreeDefinition } from './ModelSubtreeDefinition.ts';

export type SubtreeNodeType = 'group' | 'model';

export abstract class SubtreeDefinition<SubtreeType extends SubtreeNodeType>
	extends DescendentNodeDefinition<'subtree', NonRepeatGroupElementDefinition | null>
	implements NodeDefinition<'subtree'>
{
	readonly type = 'subtree';

	abstract readonly subtreeType: SubtreeType;

	readonly nodeName: string;
	readonly children: readonly ChildNodeDefinition[];
	readonly instances = null;
	readonly defaultValue = null;

	constructor(
		parent: ParentNodeDefinition,
		bind: BindDefinition,
		bodyElement: NonRepeatGroupElementDefinition | null,
		readonly node: Element
	) {
		super(parent, bind, bodyElement);

		const { root } = parent;

		this.nodeName = node.localName;
		this.children = root.buildSubtree(this as AnySubtreeDefinition);
	}

	toJSON() {
		const { parent, bodyElement, bind, root, ...rest } = this;

		return rest;
	}
}

// prettier-ignore
export type AnySubtreeDefinition =
	| GroupSubtreeDefinition
	| ModelSubtreeDefinition;

export type TypedSubtreeDefinition<SubtreeType extends SubtreeNodeType> = Extract<
	AnySubtreeDefinition,
	{ readonly subtreeType: SubtreeType }
>;
