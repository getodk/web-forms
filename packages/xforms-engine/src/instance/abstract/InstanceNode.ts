import type { XFormsXPathEvaluator } from '@odk-web-forms/xpath';
import type { BaseNode, BaseNodeState } from '../../client/BaseNode.ts';
import type {
	ClientState,
	EngineClientState,
	EngineState,
} from '../../lib/reactivity/engine-client-state.ts';
import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { AnyNodeDefinition } from '../../model/NodeDefinition.ts';
import type { Root } from '../Root.ts';
import type { AnyChildNode, AnyParentNode } from '../hierarchy.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import type { InstanceConfig } from '../internal-api/InstanceConfig.ts';
import type { SubscribableDependency } from '../internal-api/SubscribableDependency.ts';

export interface InstanceNodeState extends BaseNodeState {
	get children(): readonly AnyChildNode[] | null;
}

export abstract class InstanceNode<
		Definition extends AnyNodeDefinition,
		State extends InstanceNodeState,
	>
	implements BaseNode, EvaluationContext, SubscribableDependency
{
	/**
	 * Note: {@link currentState} is expected to reference this property's
	 * {@link EngineClientState.clientState | `clientState`} sub-property.
	 */
	protected readonly state: EngineClientState<State>;

	/**
	 * Convenience access to the same property in {@link state}.
	 */
	protected readonly engineState: EngineState<State>;

	// BaseNode: identity
	readonly nodeId: string;

	// BaseNode: node-specific
	readonly definition: Definition;

	readonly currentState: ClientState<State>;

	// BaseNode: instance-global/shared
	readonly engineConfig: InstanceConfig;

	// BaseNode: structural
	abstract readonly root: Root;
	abstract readonly parent: AnyParentNode | null;

	// EvaluationContext: instance-global/shared
	abstract readonly evaluator: XFormsXPathEvaluator;

	// EvaluationContext *and* Subscribable: node-specific
	readonly scope: ReactiveScope;

	// EvaluationContext: node-specific
	abstract get contextReference(): string;
	abstract readonly contextNode: Element;

	constructor(
		engineConfig: InstanceConfig,
		definition: Definition,
		state: EngineClientState<State>
	) {
		this.engineConfig = engineConfig;
		this.nodeId = engineConfig.createUniqueId();
		this.definition = definition;
		this.state = state;
		this.engineState = state.engineState;
		this.currentState = state.clientState;
		this.scope = state.scope;
	}

	// EvaluationContext: node-relative
	abstract getSubscribableDependencyByReference(reference: string): SubscribableDependency | null;

	// SubscribableDependency: node-specific
	abstract subscribe(): void;
}
