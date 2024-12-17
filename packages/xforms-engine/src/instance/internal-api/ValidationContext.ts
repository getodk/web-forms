import type { FormNodeID } from '../../client/identity.ts';
import type { AnyViolation } from '../../client/validation.ts';
import type { BindComputationExpression } from '../../parse/expression/BindComputationExpression.ts';
import type { MessageDefinition } from '../../parse/text/MessageDefinition.ts';
import type { EvaluationContext } from './EvaluationContext.ts';

interface ValidationContextCurrentState {
	get reference(): string;
}

interface ValidationContextDefinitionBind {
	readonly constraint: BindComputationExpression<'constraint'>;
	readonly constraintMsg: MessageDefinition<'constraintMsg'> | null;
	readonly required: BindComputationExpression<'required'>;
	readonly requiredMsg: MessageDefinition<'requiredMsg'> | null;
}

interface ValidationContextDefinition {
	readonly bind: ValidationContextDefinitionBind;
}

export interface ValidationContext extends EvaluationContext {
	readonly nodeId: FormNodeID;
	readonly definition: ValidationContextDefinition;
	readonly currentState: ValidationContextCurrentState;

	getViolation(): AnyViolation | null;
	isRelevant(): boolean;
	isRequired(): boolean;
	isBlank(): boolean;
}
