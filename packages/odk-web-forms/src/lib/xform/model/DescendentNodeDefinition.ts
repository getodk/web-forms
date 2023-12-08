import type { AnyBodyElementDefinition } from '../body/BodyDefinition.ts';
import type { RepeatDefinition } from '../body/RepeatDefinition.ts';
import type { BindDefinition } from './BindDefinition.ts';
import type {
	ChildNodeDefinition,
	NodeDefinition,
	NodeDefinitionType,
	ParentNodeDefinition,
} from './NodeDefinition.ts';
import type { RepeatInstanceDefinition } from './RepeatInstanceDefinition.ts';
import type { RootDefinition } from './RootDefinition.ts';

export type DescendentNodeType = Exclude<NodeDefinitionType, 'root'>;

type DescendentNodeBodyElement = AnyBodyElementDefinition | RepeatDefinition;

export abstract class DescendentNodeDefinition<
	Type extends DescendentNodeType,
	BodyElement extends DescendentNodeBodyElement | null = DescendentNodeBodyElement | null,
> implements NodeDefinition<Type>
{
	abstract readonly type: Type;
	abstract readonly children: readonly ChildNodeDefinition[] | null;
	abstract readonly instances: readonly RepeatInstanceDefinition[] | null;
	abstract readonly defaultValue: string | null;
	abstract readonly node: Element | null;
	abstract readonly nodeName: string;

	readonly root: RootDefinition;
	readonly nodeset: string;
	readonly dependencyExpressions: ReadonlySet<string>;
	readonly isTranslated: boolean = false;

	constructor(
		readonly parent: ParentNodeDefinition,
		readonly bind: BindDefinition,
		readonly bodyElement: BodyElement
	) {
		this.root = parent.root;
		this.nodeset = bind.nodeset;

		if (bind.isTranslated || bodyElement?.isTranslated) {
			this.isTranslated = true;
		}

		this.dependencyExpressions = new Set([
			...bind.dependencyExpressions,
			...(bodyElement?.dependencyExpressions ?? []),
		]);
	}
}
