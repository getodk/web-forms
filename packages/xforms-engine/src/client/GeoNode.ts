import type { RuntimeValue } from '../lib/codecs/getSharedValueCodec.ts';
import type { GeoControlDefinition } from '../parse/body/control/GeoControlDefinition.ts';
import type { LeafNodeDefinition } from '../parse/model/LeafNodeDefinition.ts';
import type { BaseValueNode, BaseValueNodeState } from './BaseValueNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { NodeAppearances } from './NodeAppearances.ts';
import type { RootNode } from './RootNode.ts';
import type { LeafNodeValidationState } from './validation.ts';
import type { ValueType } from './ValueType.ts';

type GeoValue<V extends ValueType> = RuntimeValue<V> | null;

interface RuntimeGeoValuesByType {
	readonly geopoint: string;
	readonly geotrace: string;
	readonly geoshape: string;
}

type GeoValueType = ValueType & keyof RuntimeGeoValuesByType;

type GeoNodeGeoValue<V extends GeoValueType> = RuntimeGeoValuesByType[V];

interface GeoNodeState<V extends ValueType> extends BaseValueNodeState<GeoValue<V>> {
	get value(): GeoValue<V>;
}

interface GeoDefinition<V extends ValueType = ValueType> extends LeafNodeDefinition<V> {
	readonly bodyElement: GeoControlDefinition;
}

type GeoNodeAppearances = NodeAppearances<GeoDefinition>;

interface GeoNode<V extends GeoValueType = GeoValueType> extends BaseValueNode<V, GeoValue<V>> {
	readonly nodeType: 'input';
	readonly valueType: V;
	readonly appearances: GeoNodeAppearances;
	readonly definition: GeoDefinition<V>;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;
	readonly currentState: GeoNodeState<V>;
	readonly validationState: LeafNodeValidationState;

	setValue(value: GeoNodeGeoValue<V>): RootNode;
}

export type GeopointNode = GeoNode<'geopoint'>;
export type GeoshapeNode = GeoNode<'geopoint'>;
export type GeotraceNode = GeoNode<'geopoint'>;

// prettier-ignore
export type AnyGeoNode =
	| GeopointNode
	| GeoshapeNode
	| GeotraceNode;
