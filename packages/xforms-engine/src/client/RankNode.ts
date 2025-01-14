import type { InputValue } from './InputNode.ts';
import type { ValueType } from './ValueType.ts';
import type { LeafNodeDefinition } from '../parse/model/LeafNodeDefinition.ts';
import { RankControlDefinition } from '../parse/body/control/RankControlDefinition.ts';
import type { BaseValueNode } from './BaseValueNode.ts';

export type RankItemValue<V extends ValueType> = NonNullable<RuntimeValue<V>>;

export type RankValues<V extends ValueType> = ReadonlyArray<RankItemValue<V>>;

export interface RankDefinition<V extends ValueType = ValueType> extends LeafNodeDefinition<V> {
	readonly bodyElement: RankControlDefinition;
}

export interface RankNode<V extends ValueType = ValueType> extends BaseValueNode<V, InputValue<V>> {
	readonly nodeType: 'rank';
}

// prettier-ignore
export type AnyRankNode = RankNode;
