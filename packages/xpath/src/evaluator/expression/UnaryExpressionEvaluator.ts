import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import type { EvaluationContext } from '../../context/EvaluationContext.ts';
import type { UnaryExprNode } from '../../static/grammar/SyntaxNode.ts';
import type { ExpressionEvaluator } from './ExpressionEvaluator.ts';
import { NumberExpressionEvaluator } from './NumberExpressionEvaluator.ts';
import { createExpression } from './factory.ts';

export class UnaryExpressionEvaluator extends NumberExpressionEvaluator {
	readonly operand: ExpressionEvaluator;

	constructor(readonly syntaxNode: UnaryExprNode) {
		super(null);

		this.operand = createExpression(syntaxNode.children[0]);
	}

	evaluateNumber<T extends XPathNode>(context: EvaluationContext<T>): number {
		return this.operand.evaluate(context).toNumber() * -1;
	}
}
