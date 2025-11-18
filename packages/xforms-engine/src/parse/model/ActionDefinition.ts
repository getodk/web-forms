import { ActionComputationExpression } from '../expression/ActionComputationExpression.ts';
import type { XFormDefinition } from '../XFormDefinition.ts';
import type { ModelDefinition } from './ModelDefinition.ts';

export const SET_ACTION_EVENTS = {
	odkInstanceLoad: 'odk-instance-load',
	odkInstanceFirstLoad: 'odk-instance-first-load',
	odkNewRepeat: 'odk-new-repeat',
	xformsValueChanged: 'xforms-value-changed',
} as const;
type SetActionEvent = (typeof SET_ACTION_EVENTS)[keyof typeof SET_ACTION_EVENTS];
const isKnownEvent = (event: SetActionEvent): event is SetActionEvent =>
	Object.values(SET_ACTION_EVENTS).includes(event);

export class ActionDefinition {
	readonly computation: ActionComputationExpression<'string'>;

	constructor(
		readonly form: XFormDefinition,
		protected readonly model: ModelDefinition,
		readonly element: Element,
		readonly ref: string,
		readonly events: string[],
		readonly value: string,
		readonly isConditional: boolean
	) {
		const unknownEvents = events.filter((event) => !isKnownEvent(event as SetActionEvent));

		// console.log('creating defn', {ref, events, value});

		if (unknownEvents.length) {
			throw new Error(
				`An action was registered for unsupported events: ${unknownEvents.join(', ')}`
			);
		}

		const inModel = element.parentElement?.nodeName === 'model';
		if (inModel && events.includes('odk-new-repeat')) {
			throw new Error('Model contains "setvalue" element with "odk-new-repeat" event');
		}

		// consider storing the source element and/or getter for the source value
		// TODO probably can't use this - it needs to be more dynamic
		this.computation = new ActionComputationExpression('string', value || "''");
	}
}
