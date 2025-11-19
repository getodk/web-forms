import type { XFormDefinition } from '../XFormDefinition.ts';
import { ActionDefinition, SET_ACTION_EVENTS } from './ActionDefinition.ts';
import type { ModelDefinition } from './ModelDefinition.ts';

const REPEAT_REGEX = /(\[[^\]]*\])/gm;

export class ModelActionMap extends Map<string, ActionDefinition> {
	// This is probably overkill, just produces a type that's readonly at call site.
	static fromModel(model: ModelDefinition): ModelActionMap {
		return new this(model.form, model);
	}

	static getKey(ref: string): string {
		return ref.replace(REPEAT_REGEX, '');
	}

	protected constructor(
		protected readonly form: XFormDefinition,
		protected readonly model: ModelDefinition
	) {
		super(
			form.xformDOM.setValues.map((setValueElement) => {
				const action = new ActionDefinition(form, setValueElement);
				if (action.events.includes(SET_ACTION_EVENTS.odkNewRepeat)) {
					throw new Error('Model contains "setvalue" element with "odk-new-repeat" event');
				}
				const key = ModelActionMap.getKey(action.ref);
				return [key, action];
			})
		);
	}

	override get(ref: string): ActionDefinition | undefined {
		return super.get(ModelActionMap.getKey(ref));
	}

	add(form: XFormDefinition, setValueElement: Element) {
		const action = new ActionDefinition(form, setValueElement);
		const key = ModelActionMap.getKey(action.ref);
		this.set(key, action);
	}
}
