import type { StaticElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import { NamespaceDeclarationMap } from '../../lib/names/NamespaceDeclarationMap.ts';
import { QualifiedName } from '../../lib/names/QualifiedName.ts';
import type { AnyBodyElementDefinition } from '../body/BodyDefinition.ts';
import type { GroupElementDefinition } from '../body/GroupElementDefinition.ts';
import type { BindDefinition } from './BindDefinition.ts';
import { DescendentNodeDefinition } from './DescendentNodeDefinition.ts';
import type { ModelDefinition } from './ModelDefinition.ts';
import type { ChildNodeDefinition, ParentNodeDefinition } from './NodeDefinition.ts';
import { RootAttributeMap } from './RootAttributeMap.ts';

export class GroupDefinition extends DescendentNodeDefinition<
	'group',
	GroupElementDefinition | null
> {
	readonly type = 'group';

	readonly namespaceDeclarations: NamespaceDeclarationMap;
	readonly qualifiedName: QualifiedName;
	readonly children: readonly ChildNodeDefinition[];
	readonly attributes: RootAttributeMap;

	constructor(
		model: ModelDefinition,
		parent: ParentNodeDefinition,
		bind: BindDefinition,
		bodyElement: AnyBodyElementDefinition | null,
		readonly template: StaticElement
	) {
		if (
			bodyElement != null &&
			(bodyElement.category !== 'structure' || bodyElement.type === 'repeat')
		) {
			throw new Error(`Unexpected body element for nodeset ${bind.nodeset}`);
		}

		super(parent, bind, bodyElement);

		const { root } = parent;

		this.qualifiedName = template.qualifiedName;
		this.namespaceDeclarations = new NamespaceDeclarationMap(this);
		this.children = root.buildSubtree(this, template);

		this.attributes = RootAttributeMap.from(model, this, template); // TODO this is passing in all binds, not just for this
	}

	toJSON() {
		const { parent, bodyElement, bind, root, ...rest } = this;

		return rest;
	}
}
