import type { JSONValue } from '@getodk/common/types/JSONValue.ts';
import type { RankNode } from '@getodk/xforms-engine';
import { ValueNodeAnswer } from './ValueNodeAnswer.ts';

/**
 * Produces a value which may be **assigned** to a {@link RankNode}, e.g.
 * as part of a test's "act" phase.
 */
export class RankNodeAnswer extends ValueNodeAnswer<RankNode> {
	readonly stringValue: string;
	readonly value: readonly string[];

	constructor(node: RankNode) {
		super(node);

		this.stringValue = node.currentState.instanceValue;
		this.value = node.currentState.value;
	}

	override inspectValue(): JSONValue {
		return this.stringValue;
	}
}
