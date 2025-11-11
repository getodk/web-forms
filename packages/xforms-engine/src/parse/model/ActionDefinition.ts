import { ActionComputationExpression } from '../expression/ActionComputationExpression.ts';
import type { XFormDefinition } from '../XFormDefinition.ts';
import type { ModelDefinition } from './ModelDefinition.ts';

export class ActionDefinition {

	readonly computation: ActionComputationExpression<'string'>;
	
	constructor(
		readonly form: XFormDefinition,
		protected readonly model: ModelDefinition,
		readonly element: Element,
		readonly ref: string,
		readonly events: string[],
		readonly value: string
	) {
		// consider storing the source element and/or getter for the source value
		this.computation = new ActionComputationExpression('string', value || "''");
	}

}
