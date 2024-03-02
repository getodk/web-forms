import type { XFormDefinition } from '../../xform/XFormDefinition.ts';
import type { RootDefinition } from '../../xform/model/RootDefinition.ts';
import type { FormNodeState } from './FormNodeState.ts';
import type { ParentNode } from './ParentNode.ts';
import type { OpaqueReactiveObjectFactory } from './state/OpaqueReactiveObjectFactory.ts';
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- referenced in JSDoc
import type { TextRange } from './text/TextRange.ts';
import type { ActiveLanguage, TranslationLanguage } from './text/TranslationLanguage.ts';

/**
 * The root node's state retains several aspects of the base
 * {@link FormNodeState} interface, although those aspects are guaranteed to be
 * static at the root. This consistency, while redundant, allows the root node
 * to be treated like any other node by clients (and the web-forms engine), e.g.
 * for purposes of traversal.
 */
type StaticFormNodeState = Readonly<FormNodeState>;

export interface RootNodeState extends StaticFormNodeState {
	get activeLanguage(): ActiveLanguage;
}

/**
 * The root node of the web-forms engine's schema/state tree (@see
 * {@link FormNode}). This node will typically be the the entrypoint for a
 * client to interact with the web-forms engine, and forms implemented by it.
 */
export interface RootNode extends ParentNode<RootDefinition, RootNodeState> {
	// TODO: this is intended more as a possible hint to implementation, and
	// likely shouldn't actually be exposed to clients.
	readonly form: XFormDefinition;

	// TODO: also a hint to implementation. Harmless to expose to clients, as
	// they supply this factory, but they likely wouldn't benefit from it either.
	readonly clientStateFactory: OpaqueReactiveObjectFactory;

	/**
	 * The root node has no parent, but retains the property for consistency of
	 * traversal logic in clients (as well as the engine itself).
	 */
	readonly parent: null;

	get languages(): readonly TranslationLanguage[];

	/**
	 * Sets the form's active language. When called, this will update the state
	 * of {@link RootNodeState.activeLanguage}, affecting translations throughout
	 * the form. As such, this may result in updates to nodes with
	 * {@link TextRange} state (e.g. labels, hints).
	 */
	setLanguage: (language: string) => RootNode;
}
