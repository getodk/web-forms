import { XFormDOM } from './XFormDOM.ts';
import { BodyDefinition } from './body/BodyDefinition.ts';
import { ModelDefinition } from './model/ModelDefinition.ts';
import type { AnyNodeDefinition } from './model/NodeDefinition.ts';
import type { RootDefinition } from './model/RootDefinition.ts';

type TopologicalSortIndex = number;

type SortedNodesetIndexes = ReadonlyMap<string, TopologicalSortIndex>;

const collectNodes = (parentNode: AnyNodeDefinition): readonly AnyNodeDefinition[] => {
	let children: readonly AnyNodeDefinition[];

	switch (parentNode.type) {
		case 'repeat-sequence':
			children = parentNode.instances;
			break;

		case 'value-node':
			children = [];
			break;

		default:
			children = parentNode.children;
	}

	return [parentNode].concat(children.flatMap(collectNodes));
};

const visit = (
	nodesByNodeset: Map<string, AnyNodeDefinition>,
	visited: Set<AnyNodeDefinition>,
	visiting: Set<AnyNodeDefinition>,
	node: AnyNodeDefinition,
	sorted: AnyNodeDefinition[]
): AnyNodeDefinition[] => {
	if (visited.has(node)) {
		return sorted;
	}

	if (visiting.has(node)) {
		throw new Error(`Cycle detected for node with nodeset: ${node.nodeset}`);
	}

	visiting.add(node);

	for (const nodeset of node.dependencyExpressions) {
		const dependency = nodesByNodeset.get(nodeset);

		if (dependency != null) {
			visit(nodesByNodeset, visited, visiting, dependency, sorted);
		}
	}

	visiting.delete(node);
	visited.add(node);
	sorted.push(node);

	return sorted;
};

const sortNodes = (root: RootDefinition): SortedNodesetIndexes => {
	const nodes = collectNodes(root);
	const nodesByNodeset = new Map<string, AnyNodeDefinition>(
		nodes.map((node) => [node.nodeset, node])
	);

	const visited = new Set<AnyNodeDefinition>();
	const visiting = new Set<AnyNodeDefinition>();
	const sorted: AnyNodeDefinition[] = [];

	for (const node of nodes) {
		visit(nodesByNodeset, visited, visiting, node, sorted);
	}

	return new Map(sorted.map((node, index) => [node.nodeset, index]));
};

export class XFormDefinition {
	readonly xformDOM: XFormDOM;
	readonly xformDocument: XMLDocument;

	readonly id: string;
	readonly title: string;

	readonly rootReference: string;

	/**
	 * This property is not used after the `XFormDefinition` constructor completes
	 * (and it was never intended to be!). It is currently only used to provide a
	 * means for constructing {@link ModelDefinition}. It will go away in a
	 * subsequent commit!
	 */
	readonly body: BodyDefinition;
	readonly model: ModelDefinition;
	readonly sortedNodesetIndexes: SortedNodesetIndexes;

	constructor(readonly sourceXML: string) {
		const xformDOM = XFormDOM.from(sourceXML);

		this.xformDOM = xformDOM;

		const { primaryInstanceRoot, title, xformDocument } = xformDOM;
		const id = primaryInstanceRoot.getAttribute('id');

		if (id == null) {
			throw new Error('Primary instance root has no id');
		}

		this.xformDocument = xformDocument;
		this.id = id;
		this.title = title.textContent ?? '';

		// TODO: highly unlikely primary instance root will need a namespace prefix
		// but noting it just in case there is such weird usage...
		this.rootReference = `/${primaryInstanceRoot.localName}`;

		const body = new BodyDefinition(this);

		this.body = body;

		// TypeScript (correctly!) objects to deleting a `readonly` property. If the
		// type says the `body` property has a `BodyDefinition`, and we delete it
		// here, we can break any downstream use of `XFormDefinition` which expects
		// that type to be accurate.
		//
		// @ts-expect-error - ^
		delete this.body;

		// In fact, we'll demonstrate this. By suppressing the type error, we've now
		// broken the contract with `ModelDefinition`.

		let caughtModelDefinitionConstructorException: Error | null = null;

		let model: ModelDefinition | null = null;

		try {
			model = new ModelDefinition(this);
		} catch (error) {
			if (error instanceof Error) {
				caughtModelDefinitionConstructorException = error;
			}
		}

		if (caughtModelDefinitionConstructorException == null || model != null) {
			throw new Error(
				'The above comments about breaking the contract with `ModelDefinition` no longer hold. Delete me, and that commentary!'
			);
		}

		this.body = body;
		model = new ModelDefinition(this);

		this.model = model;

		this.sortedNodesetIndexes = sortNodes(this.model.root);
	}
}
