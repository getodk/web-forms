import type { XFormDefinition } from '../XFormDefinition.ts';
import { ActionDefinition } from './ActionDefinition.ts';
import type { ModelDefinition } from './ModelDefinition.ts';

export class ModelActionMap extends Map<string, ActionDefinition> {
	// This is probably overkill, just produces a type that's readonly at call site.
	static fromModel(model: ModelDefinition): ModelActionMap {
		return new this(model.form, model);
	}

	static getValue(element: Element): string | null {
		if (element.hasAttribute('value')) {
			return element.getAttribute('value');
		}
		if (element.firstChild?.nodeValue) {
			return `'${element.firstChild?.nodeValue}'`;
		}
		return null;
	}

	protected constructor(
		protected readonly form: XFormDefinition,
		protected readonly model: ModelDefinition
	) {
		super(
			form.xformDOM.setValues.map((setValueElement) => {
				const ref = setValueElement.getAttribute('ref');
				const events = setValueElement.getAttribute('event')?.split(' ');

				// const parentRef = setValueElement.parentElement?.getAttribute('ref'); // TODO this is needed only for value attributes, not literals
				// console.log('listen to: ', {parentRef});

				const value = ModelActionMap.getValue(setValueElement);
				const action = new ActionDefinition(form, model, setValueElement, ref!, events, value!); // TODO do something about ref and value - they must not be undefined

				console.log('~~~~~~~~~ creation, pushing', ref, events);
				return [ref!, action];
			})
		);
	}

	getOrCreateActionDefinition(nodeset: string, element: Element): ActionDefinition | undefined { // TODO I don't think we need to "create" any more - we're doing everything in the construcotr
		const ref = element?.getAttribute('ref');
		let action;
		if (element && ref) {

			action = this.get(ref);
	
			
			if (action == null) {
				const events = element.getAttribute('event')?.split(' ');
				const value = ModelActionMap.getValue(element);
				if (ref && events && value) {
					action = new ActionDefinition(this.form, this.model, element, ref!, events!, value!);
					console.log('~~~~~~~~~ fetching, pushing', ref);
					this.set(ref, action);
				}
			}
		}

		return action;
	}

}
