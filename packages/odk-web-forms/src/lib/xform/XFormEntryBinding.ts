import type { BindingState } from '../reactivity/model-state.ts';
import { createBindingState } from '../reactivity/model-state.ts';
import type { XFormDefinition } from './XFormDefinition.ts';
import type { XFormDOM } from './XFormDOM.ts';
import type { XFormEntry } from './XFormEntry.ts';
import type { XFormModelBind } from './XFormModelBind.ts';

export class XFormEntryBinding {
	protected readonly xformDocument: XMLDocument;
	protected readonly model: Element;
	protected readonly primaryInstance: Element;
	protected readonly primaryInstanceRoot: Element;

	// TODO: non-element bindings (i.e. Attr, ...?)
	protected readonly modelNode: Element;

	readonly nodeset: string;

	// TODO: ideally this would not be public. Perhaps it can be again if state
	// becomes part of this class?
	readonly state: BindingState;

	readonly parent: XFormEntryBinding | null;

	constructor(
		readonly form: XFormDefinition,
		protected readonly instanceDOM: XFormDOM,
		protected readonly entry: XFormEntry,
		readonly bind: XFormModelBind
	) {
		const { xformDocument, model, primaryInstance, primaryInstanceRoot, primaryInstanceEvaluator } =
			instanceDOM;

		this.xformDocument = xformDocument;
		this.model = model;
		this.primaryInstance = primaryInstance;
		this.primaryInstanceRoot = primaryInstanceRoot;

		const { nodeset, parentNodeset } = bind;
		const modelNode = primaryInstanceEvaluator.evaluateNonNullElement(nodeset);

		this.nodeset = nodeset;
		this.modelNode = modelNode;

		if (parentNodeset == null) {
			this.parent = null;
		} else {
			const parent = entry.getBinding(parentNodeset);

			if (parent == null) {
				console.error('No binding for parent nodeset', parentNodeset);
			}

			this.parent = parent;
		}

		this.state = createBindingState(entry, this);
	}

	evaluateTranslatedExpression(expression: string): string {
		// TODO: lol such a hack, obviously temp and needs to be handled somewhere else.
		// Will very likely look like binding computations.
		this.entry.getCurrentLanguage();

		return this.entry.instanceDOM.primaryInstanceEvaluator.evaluateString(expression, {
			contextNode: this.getElement(),
		});
	}

	getCurrentLanguage(): string | null {
		return this.entry.getCurrentLanguage();
	}

	getElement(): Element {
		return this.modelNode;
	}

	getValue = (): string => {
		return this.state.getValue();
	};

	isReadonly(): boolean {
		return this.state.isReadonly();
	}

	isRelevant(): boolean {
		const { parent } = this;

		if (parent != null && !parent.isRelevant()) {
			return false;
		}

		return this.state.isRelevant();
	}

	isRequired(): boolean {
		return this.state.isRequired();
	}

	setValue(value: string): void {
		this.state.setValue(value);
	}

	toJSON() {
		return {};
	}
}
