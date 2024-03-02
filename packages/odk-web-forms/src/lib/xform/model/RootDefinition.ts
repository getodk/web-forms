import type { XFormDefinition } from '../XFormDefinition.ts';
import type { BodyDefinition } from '../body/BodyDefinition.ts';
import type { RepeatGroupDefinition } from '../body/group/RepeatGroupDefinition.ts';
import type { BindDefinition } from './BindDefinition.ts';
import type { ModelDefinition } from './ModelDefinition.ts';
import type {
	ChildNodeDefinition,
	NodeDefinition,
	ParentNodeDefinition,
} from './NodeDefinition.ts';
import { RepeatSequenceDefinition } from './RepeatSequenceDefinition.ts';
import { SubtreeDefinition } from './SubtreeDefinition.ts';
import { ValueNodeDefinition } from './ValueNodeDefinition.ts';

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

	/**
	 * Stored internally during construction, in order to associate aspects of the
	 * parsed body with the model nodes they reference. This property is otherwise
	 * ephemeral. It is removed upon completing the aspects of construction which
	 * reference it.
	 *
	 * Instead of this temporary storage on the root, we could consider passing it
	 * through to each descendant node constructor. But that would in turn pass it
	 * right back to the {@link buildSubtree} method on this class, which is the
	 * only place it's ultimately used. That's a lot of indirection for what
	 * otherwise is effectively a local variable which goes out of use when its
	 * scope exits.
	 *
	 * We could also consider that this more isolated indirection is a consequence
	 * of, perhaps, overuse of classes for this aspect of the domain model. That is
	 * a worthwhile question, but probably better for another time!
	 */
	private body?: BodyDefinition;

	constructor(
		protected readonly form: XFormDefinition,
		protected readonly model: ModelDefinition,

		/**
		 * Note: we don't use a
		 * {@link https://www.typescriptlang.org/docs/handbook/2/classes.html#parameter-properties | parameter property}
		 * here, because while the body **property** is ephemeral (and marked
		 * optional), it's required at the constructor call site.
		 */
		body: BodyDefinition
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
		this.children = this.buildRootTree(body);

		delete this.body;
	}

	private buildRootTree(body: BodyDefinition): readonly ChildNodeDefinition[] {
		this.body = body;

		try {
			return this.buildSubtree(this);
		} finally {
			delete this.body;
		}
	}

	buildSubtree(parent: ParentNodeDefinition): readonly ChildNodeDefinition[] {
		const { model } = this;
		const { body } = this;
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
			const bodyElement = body!.getBodyElement(nodeset);
			const [firstChild, ...restChildren] = children;
			const repeatGroup = body!.getRepeatGroup(nodeset);

			if (repeatGroup != null) {
				const repeatDefinition = (bodyElement as RepeatGroupDefinition).repeat;

				if (repeatDefinition == null) {
					throw 'TODO: this is why I have hesitated to pick an "is repeat" predicate direction';
				}

				return new RepeatSequenceDefinition(parent, bind, repeatGroup, children);
			}

			if (restChildren.length) {
				throw new Error(`Unexpected: multiple elements for non-repeat nodeset: ${nodeset}`);
			}

			const element = firstChild;
			const isLeafNode = element.childElementCount === 0;

			if (isLeafNode) {
				return new ValueNodeDefinition(parent, bind, bodyElement, element);
			}

			return new SubtreeDefinition(parent, bind, bodyElement, element);
		});
	}

	toJSON() {
		const { bind, bodyElement, form, model, root, ...rest } = this;

		return rest;
	}
}
