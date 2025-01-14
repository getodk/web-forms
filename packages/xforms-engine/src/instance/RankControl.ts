import type { ValueType } from '../client/ValueType.ts';
import { ValueNode } from './abstract/ValueNode.ts';
import type { XFormsXPathElement } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import type { ValidationContext } from './internal-api/ValidationContext.ts';
import type {
	ClientReactiveSubmittableValueNode,
} from './internal-api/submission/ClientReactiveSubmittableValueNode.ts';
import type {
	RankDefinition,
	RankValues,
	RankNode,
} from '../client/RankNode.ts';

export class RankControl<V extends ValueType = ValueType>
	extends ValueNode<V, RankDefinition<V>, RankValues<V>, RankValues<V>>
	implements
		RankNode<V>,
		XFormsXPathElement,
		EvaluationContext,
		ValidationContext,
		ClientReactiveSubmittableValueNode
{

}

export type AnyRankControl = RankControl<string>;
