import type { KnownAttributeLocalNamedElement } from '@getodk/common/types/dom.ts';
import type { TextChunkSource } from '../../client/TextRange.ts';
import type { AnyTextRangeDefinition } from '../text/abstract/TextRangeDefinition.ts';
import { isTranslationExpression } from '../xpath/semantic-analysis.ts';
import { DependentExpression, DependentExpressionResultType } from './abstract/DependentExpression.ts';

interface TextChunkExpressionOptions {
	readonly isTranslated?: true;
}

interface OutputElement extends KnownAttributeLocalNamedElement<'output', 'value'> {}

const isOutputElement = (element: Element): element is OutputElement => {
	return element.localName === 'output' && element.hasAttribute('value');
};

export class TextChunkExpression<T> extends DependentExpression<T> {
	readonly source: TextChunkSource;
	// Set for the literal source, blank otherwise
	readonly stringValue: string;

	constructor(
		context: AnyTextRangeDefinition,
		resultType: DependentExpressionResultType,
		expression: string,
		source: TextChunkSource,
		options: TextChunkExpressionOptions = {},
		literalValue = ''
	) {
		super(context, resultType, expression, {
			semanticDependencies: {
				translations: options.isTranslated,
			},
			ignoreContextReference: true,
		});

		this.source = source;
		this.stringValue = literalValue;
	}

	static fromLiteral(context: AnyTextRangeDefinition, stringValue: string): TextChunkExpression {
		return new TextChunkExpression<'string'>(context, 'string', 'null', 'literal', {}, stringValue);
	}

	static fromReference(context: AnyTextRangeDefinition, ref: string): TextChunkExpression {
		return new TextChunkExpression<'string'>(context, 'string', ref, 'reference');
	}

	static fromOutput(context: AnyTextRangeDefinition, element: Element): TextChunkExpression<'string'> | null {
		if (!isOutputElement(element)) {
			return null;
		}

		return new TextChunkExpression<'string'>(context, 'string', element.getAttribute('value'), 'output');
	}

	static fromTranslation(
		context: AnyTextRangeDefinition,
		maybeExpression: string
	): TextChunkExpression<'string'> | null {
		if (isTranslationExpression(maybeExpression)) {
			return new TextChunkExpression<'string'>(context, 'string', maybeExpression, 'translation', {
				isTranslated: true,
			});
		}

		return null;
	}

	/**
	 * Use this when you need the entire translation node of itext,
	 * such as for displaying media or accessing alternate values (e.g., `<value form="short">`).
	 */
	static fromTranslationNodeSet(
		context: AnyTextRangeDefinition,
		maybeExpression: string
	): TextChunkExpression<'nodes'> | null {
		if (isTranslationExpression(maybeExpression)) {
			return new TextChunkExpression<'nodes'>(context, 'nodes', maybeExpression, 'translation', {
				isTranslated: true,
			});
		}

		return null;
	}
}
