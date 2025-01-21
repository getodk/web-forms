import type { RankType, RankControlDefinition } from '../parse/body/control/RankControlDefinition.ts';
import type { LeafNodeDefinition } from '../parse/model/LeafNodeDefinition.ts';
import type { BaseValueNode, BaseValueNodeState } from './BaseValueNode.ts';
import type { RootNode } from './RootNode.ts';
import type { TextRange } from './TextRange.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { LeafNodeValidationState } from './validation.ts';

export interface RankItem {
	get label(): TextRange<'item-label'>;
	get value(): string;
}

export type RankValueOptions = readonly RankItem[];

export interface RankNodeState extends BaseValueNodeState<readonly string[]> {
	get valueOptions(): RankValueOptions;

	/**
	 * This value is an ordered collection of {@link RankItem}s.
	 * The order of the items is important and should be preserved during processing.
	 */
	get value(): readonly string[];
}

export interface RankDefinition extends LeafNodeDefinition<V> {
	readonly bodyElement: RankControlDefinition;
}

export interface RankNode extends BaseValueNode<'string', readonly string[]> {
	readonly nodeType: RankType;
	readonly valueType: 'string';
	readonly definition: RankDefinition<'string'>;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;
	readonly currentState: RankNodeState;
	readonly validationState: LeafNodeValidationState;

	/**
	 * Convenience API to get the value which is an ordered collection of {@link RankItem}s.
	 */
	getValueOption(value: string): RankItem | null; // ToDo: do we need this ?

	/**
	 * Set the value which is an ordered collection of {@link RankItem}s.
	 * Calling this setter replaces the currently value.
	 * If called with an empty array, the current is cleared.
	 */
	setValues(values: readonly string[]): RootNode;
}
