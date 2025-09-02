import type { LiteralNode } from '../../static/grammar/SyntaxNode.ts';
import type { ExpressionEvaluator } from './ExpressionEvaluator.ts';
import { StringExpressionEvaluator } from './StringExpressionEvaluator.ts';

function unescape(escaped: string): string {
	const quoteChar = escaped.charAt(0);
	const regex: RegExp = quoteChar === '"' ? /\\"/g : /\\'/g;
	return escaped.replace(regex, quoteChar);
}

export class StringLiteralExpressionEvaluator
	extends StringExpressionEvaluator<string>
	implements ExpressionEvaluator
{
	constructor(readonly syntaxNode: LiteralNode) {
		const text = unescape(syntaxNode.text);
		const constValue = text.substring(1, text.length - 1);
		super(constValue);
	}

	evaluateString(): string {
		return this.constValue;
	}
}
