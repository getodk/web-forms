import type { ValueType } from '../../client/ValueType.ts';
import type { StaticLeafElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import {
	NamespaceDeclarationMap,
	type NamedSubtreeDefinition,
} from '../../lib/names/NamespaceDeclarationMap.ts';
import { QualifiedName } from '../../lib/names/QualifiedName.ts';
import type { AnyBodyElementDefinition, ControlElementDefinition } from '../body/BodyDefinition.ts';
import type { ActionDefinition } from './ActionDefinition.ts';
import { AttributeDefinitionMap } from './AttributeDefinitionMap.ts';
import type { BindDefinition } from './BindDefinition.ts';
import { DescendentNodeDefinition } from './DescendentNodeDefinition.ts';
import type { ModelDefinition } from './ModelDefinition.ts';
import type { ParentNodeDefinition } from './NodeDefinition.ts';

export class LeafNodeDefinition<V extends ValueType = ValueType>
	extends DescendentNodeDefinition<'leaf-node', ControlElementDefinition | null>
	implements NamedSubtreeDefinition
{
	readonly type = 'leaf-node';
	readonly valueType: V;

	readonly namespaceDeclarations: NamespaceDeclarationMap;
	readonly qualifiedName: QualifiedName;
	readonly children = null;
	readonly attributes: AttributeDefinitionMap;

	constructor(
		model: ModelDefinition,
		parent: ParentNodeDefinition,
		bind: BindDefinition,
		readonly action: ActionDefinition | undefined,
		bodyElement: AnyBodyElementDefinition | null,
		readonly template: StaticLeafElement
	) {
		if (bodyElement != null && bodyElement.category !== 'control') {
			throw new Error(`Unexpected body element for nodeset ${bind.nodeset}`);
		}

		super(parent, bind, bodyElement); // TODO pass action up to parent

		this.valueType = bind.type.resolved satisfies ValueType as V;
		this.qualifiedName = template.qualifiedName;
		this.namespaceDeclarations = new NamespaceDeclarationMap(this);
		this.attributes = AttributeDefinitionMap.from(model, template);
	}

	toJSON() {
		const { bind, bodyElement, parent, root, ...rest } = this;

		return rest;
	}
}
