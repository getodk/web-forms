import type { AnyNodeDefinition } from '../../../xform/model/NodeDefinition.ts';
import type { EngineConfig } from './EngineConfig.ts';
import type { ActiveLanguage } from './FormLanguage.ts';
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- referenced in JSDoc
import type { OpaqueReactiveObjectFactory } from '../state/OpaqueReactiveObjectFactory.ts';
import type { TextRange } from '../text/TextRange.ts';

export interface BaseNodeState {
	get reference(): string;

	get activeLanguage(): ActiveLanguage;

	get readonly(): boolean;
	get relevant(): boolean;
	get required(): boolean;

	/**
	 * Each node's children (if it is a parent node) will be accessed on that
	 * node's state. While some node types will technically have static children,
	 * other nodes' children will be stateful (i.e. repeats). For a client, both
	 * cases are accessed the same way for consistency.
	 *
	 * @todo Interfaces for specific (non-base) node types should override this to
	 * specify the actual type of their children.
	 * @todo Interfaces for non-parent node types should override this to `null`.
	 */
	get children(): readonly BaseNode[] | null;

	get label(): TextRange<'label'> | null;

	get hint(): TextRange<'hint'> | null;

	/**
	 * @todo Interfaces for specific (non-base) node types should override this
	 * to specify the actual type of their value.
	 * @todo Parent nodes should specify their value as `null`, to make clear
	 * that parent nodes do not bear a value at all.
	 */
	get value(): unknown;
}

type FormNodeID = string;

export interface BaseNode {
	/**
	 * Each node retains access to the client-provided engine configuration.
	 *
	 * @todo this is more of a hint to implementation than a contract with clients.
	 * But it's likely harmless to expose as long as it remains (deeply) readonly.
	 */
	readonly engineConfig: EngineConfig;

	/**
	 * Each node has a unique identifier. That identifier is stable throughout
	 * the lifetime of an active session filling a form.
	 */
	readonly nodeId: FormNodeID;

	/**
	 * Each node has a definition which specifies aspects of the node defined in
	 * the form. These aspects include (but are not limited to) the node's data
	 * type, its body presentation constraints (if any), its bound nodeset, and
	 * so on...
	 *
	 * @todo Interfaces for specific (non-base) node types should override this
	 * to specify the actual (concrete or union) type of their `definition`.
	 */
	readonly definition: AnyNodeDefinition;

	/**
	 * Each node links back to the node representing the root of the form.
	 *
	 * @todo Interfaces for all concrete node types should override this to
	 * specify the actual root node type.
	 */
	readonly root: BaseNode;

	/**
	 * Each node links back to its parent, if any. All nodes have a parent except
	 * the form's {@link root}.
	 */
	readonly parent: BaseNode | null;

	/**
	 * Each node provides a discrete object representing the stateful aspects of
	 * that node which will change over time. When a client provides a {@link OpaqueReactiveObjectFactory}
	 */
	readonly currentState: BaseNodeState;
}
