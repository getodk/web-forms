import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { BindComputation } from '../../model/BindComputation.ts';
import type { EvaluationContext } from './EvaluationContext.ts';

export type InstanceValue = string;

interface ValueContextDefinitionBind {
	readonly calculate: BindComputation<'calculate'> | null;
}

export interface ValueContextDefinition {
	readonly bind: ValueContextDefinitionBind;
	readonly defaultValue: InstanceValue;
}

export interface ValueContext<RuntimeValue> extends EvaluationContext {
	readonly scope: ReactiveScope;
	readonly definition: ValueContextDefinition;
	readonly contextNode: Element;

	readonly encodeValue: (this: unknown, runtimeValue: RuntimeValue) => InstanceValue;
	readonly decodeValue: (this: unknown, instanceValue: InstanceValue) => RuntimeValue;
}
