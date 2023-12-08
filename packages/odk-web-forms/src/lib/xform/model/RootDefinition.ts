import { UnreachableError } from '@odk/common/lib/error/UnreachableError.ts';
import type { XFormDefinition } from '../XFormDefinition.ts';
import type { BindDefinition } from './BindDefinition.ts';
import type { ModelDefinition } from './ModelDefinition.ts';
import type {
	ChildNodeDefinition,
	NodeDefinition,
	ParentNodeDefinition,
} from './NodeDefinition.ts';
import { RepeatSequenceDefinition } from './RepeatSequenceDefinition.ts';
import { GroupSubtreeDefinition } from './subtree/GroupSubtreeDefinition.ts';
import { ModelSubtreeDefinition } from './subtree/ModelSubtreeDefinition.ts';
import { InputValueNodeDefinition } from './value-node/InputValueNodeDefinition.ts';
import { ModelValueNodeDefinition } from './value-node/ModelValueNodeDefinition.ts';
import { SelectValueNodeDefinition } from './value-node/SelectValueNodeDefinition.ts';

export class RootDefinition implements NodeDefinition<'root'> {
	readonly type = 'root';
	readonly bind: BindDefinition;
	readonly nodeset: string;
	readonly nodeName: string;
	readonly bodyElement = null;
	readonly root = this;
	readonly parent = null;
	readonly children: readonly ChildNodeDefinition[];
	readonly instances = null;
	readonly node: Element;
	readonly defaultValue = null;

	readonly isTranslated = false;
	readonly dependencyExpressions: ReadonlySet<string> = new Set<string>();

	constructor(
		protected readonly form: XFormDefinition,
		protected readonly model: ModelDefinition
	) {
		// TODO: theoretically the pertinent step in the bind's `nodeset` *could* be
		// namespaced. It also may make more sense to determine the root nodeset
		// earlier (i.e. in the appropriate definition class).
		//
		// TODO: while it's unlikely a form actually defines a <bind> for the root,
		// if it did, bind nodesets are not yet normalized, so `/root` may currently
		// be defined as `/ root` (or even `/ *` or any other valid expression
		// resolving to the root).
		const { primaryInstanceRoot } = form.xformDOM;
		const { localName: rootNodeName } = primaryInstanceRoot;

		this.nodeName = rootNodeName;

		const nodeset = `/${rootNodeName}`;
		const bind = model.binds.get(nodeset);

		if (bind == null) {
			throw new Error('Missing root node bind definition');
		}

		this.bind = bind;
		this.nodeset = nodeset;
		this.node = primaryInstanceRoot;
		this.children = this.buildSubtree(this);
	}

	buildSubtree(parent: ParentNodeDefinition): readonly ChildNodeDefinition[] {
		const { form, model } = this;
		const { body } = form;
		const { binds } = model;
		const { bind: parentBind, node } = parent;
		const { nodeset: parentNodeset } = parentBind;

		const childrenByName = new Map<string, [Element, ...Element[]]>();

		for (const child of node.children) {
			const { localName } = child;

			let elements = childrenByName.get(localName);

			if (elements == null) {
				elements = [child];
				childrenByName.set(localName, elements);
			} else {
				// TODO: check if previous element exists, was it previous element
				// sibling. Highly likely this should otherwise fail!
				elements.push(child);
			}
		}

		return Array.from(childrenByName).map(([localName, children]) => {
			const nodeset = `${parentNodeset}/${localName}`;
			const bind = binds.getOrCreateBindDefinition(nodeset);
			const bodyElement = body.getBodyElement(nodeset);
			const [firstChild, ...restChildren] = children;

			if (bodyElement?.type === 'repeat-group') {
				const repeatDefinition = bodyElement.repeat;

				if (repeatDefinition == null) {
					throw 'TODO: this is why I have hesitated to pick an "is repeat" predicate direction';
				}

				return new RepeatSequenceDefinition(parent, bind, bodyElement, children);
			}

			if (restChildren.length) {
				throw new Error(`Unexpected: multiple elements for non-repeat nodeset: ${nodeset}`);
			}

			const element = firstChild;
			const isLeafNode = element.childElementCount === 0;

			if (bodyElement == null || bodyElement.category === 'UNSUPPORTED') {
				if (isLeafNode) {
					return new ModelValueNodeDefinition(parent, bind, element);
				}

				return new ModelSubtreeDefinition(parent, bind, element);
			}

			if (bodyElement.category === 'control') {
				switch (bodyElement.type) {
					case 'input':
						return new InputValueNodeDefinition(parent, bind, bodyElement, element);

					case 'rank':
					case 'select':
					case 'select1':
						return new SelectValueNodeDefinition(parent, bind, bodyElement, element);

					default:
						throw new UnreachableError(bodyElement);
				}
			}

			return new GroupSubtreeDefinition(parent, bind, bodyElement, element);
		});
	}

	toJSON() {
		const { bind, bodyElement, form, model, root, ...rest } = this;

		return rest;
	}
}
