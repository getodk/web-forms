import type { XFormDefinition } from '../XFormDefinition.ts';
import { ActionDefinition } from './ActionDefinition.ts';
import type { ModelDefinition } from './ModelDefinition.ts';

const REPEAT_REGEX = /(\[[^\]]*\])/gm;

export class ModelActionMap extends Map<string, ActionDefinition> {
	// This is probably overkill, just produces a type that's readonly at call site.
	static fromModel(model: ModelDefinition): ModelActionMap {
		return new this(model.form, model);
	}

	static getValue(element: Element): string | null {
		if (element.hasAttribute('value')) {
			return element.getAttribute('value');
		}
		// TODO assert the first child is a text node?
		if (element.firstChild?.nodeValue) {
			// use the text content as the literal value
			return `'${element.firstChild?.nodeValue}'`;
		}
		// TODO throw?
		return null;
	}

	static getKey(nodeset: string): string {
		const normalized = nodeset.replace(REPEAT_REGEX, '');
		// console.log({nodeset, normalized});
		return normalized;
	}

	static getRef(model: ModelDefinition, setValueElement: Element): string | null {
		if (setValueElement.hasAttribute('ref')) {
			return setValueElement.getAttribute('ref') ?? '';
		}
		if (setValueElement.hasAttribute('bind')) {
			const bindId = setValueElement.getAttribute('bind');
			for (const definition of Array.from(model.binds.values())) {
				const element = definition.bindElement;
				if (element.getAttribute('id') === bindId) {
					return element.getAttribute('nodeset');
				}
			}
		}
		return null;
	}

	protected constructor(
		protected readonly form: XFormDefinition,
		protected readonly model: ModelDefinition
	) {
		super(
			form.xformDOM.setValues.map((setValueElement) => {
				// TODO do something about ref and value - they must not be undefined
				const ref = ModelActionMap.getRef(model, setValueElement);
				const events = setValueElement.getAttribute('event')?.split(' ');
				const key = ModelActionMap.getKey(ref!);
				const value = ModelActionMap.getValue(setValueElement);
				const conditional = key !== ref;
				const action = new ActionDefinition(form, model, setValueElement, ref!, events, value!, conditional);
				return [key, action];
			})
		);
	}

	override get(nodeset: string): ActionDefinition | undefined {
		return super.get(ModelActionMap.getKey(nodeset));
	}
}
