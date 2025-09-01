import { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type { TextChunkSource, TextRole } from '../../../client/TextRange.ts';
import type { EvaluationContext } from '../../../instance/internal-api/EvaluationContext.ts';
import { TextChunk } from '../../../instance/text/TextChunk.ts';
import { TextRange, type MediaSources } from '../../../instance/text/TextRange.ts';
import { isEngineXPathElement } from '../../../integration/xpath/adapter/kind.ts';
import { StaticElement } from '../../../integration/xpath/static-dom/StaticElement.ts';
import type { StaticChildNode } from '../../../integration/xpath/static-dom/StaticNode.ts';
import { type TextChunkExpression } from '../../../parse/expression/TextChunkExpression.ts';
import type { TextRangeDefinition } from '../../../parse/text/abstract/TextRangeDefinition.ts';
import { createComputedExpression } from '../createComputedExpression.ts';

interface ChunksAndMedia {
	chunks: readonly TextChunk[];
	mediaSources: MediaSources;
}

const createLiteralChunk = (
	context: EvaluationContext,
	source: TextChunkSource,
	value: string
): TextChunk => {
	return new TextChunk(context, source, value);
};

const evaluateChildValue = (context: EvaluationContext, child: StaticChildNode): string => {
	if (child instanceof StaticElement) {
		const value = child.getAttributeValue('value');
		if (value) {
			return context.evaluator.evaluateString(value, context);
		}
	}
	return child.getXPathValue();
};

const isMedia = (formAttribute: string): boolean =>
	['image', 'video', 'audio'].includes(formAttribute);

/**
 * Creates a reactive accessor for text chunks and an optional image from text source expressions.
 * - Combines chunks from literal and computed sources into a single array.
 * - Captures the first image found with a 'from="image"' attribute.
 *
 * @param context - The evaluation context for reactive XPath computations.
 * @param chunkExpressions - Array of text source expressions to process.
 * @returns An accessor for an object with all chunks and the first image (if any).
 */
const createTextChunks = (
	context: EvaluationContext,
	chunkExpressions: ReadonlyArray<TextChunkExpression<'nodes' | 'string'>>
): Accessor<ChunksAndMedia> => {
	return createMemo(() => {
		const chunks: TextChunk[] = [];
		const mediaSources: MediaSources = {};

		chunkExpressions.forEach((chunkExpression) => {
			if (chunkExpression.source === 'literal') {
				chunks.push(
					createLiteralChunk(context, chunkExpression.source, chunkExpression.stringValue)
				);
				return;
			}

			const computed = createComputedExpression(context, chunkExpression)();

			if (typeof computed === 'string') {
				// not a translation expression
				chunks.push(createLiteralChunk(context, chunkExpression.source, computed));
				return;
			}

			// translation expression evaluates to an entire itext block, process forms separately
			computed.forEach((itextForm) => {
				if (isEngineXPathElement(itextForm) && itextForm instanceof StaticElement) {
					const formAttribute = itextForm.getAttributeValue('form');
					if (!formAttribute) {
						itextForm.children.forEach((child) => {
							const value = evaluateChildValue(context, child);
							chunks.push(createLiteralChunk(context, chunkExpression.source, value));
						});
					} else if (isMedia(formAttribute)) {
						const formValue = itextForm.getXPathValue();
						if (JRResourceURL.isJRResourceReference(formValue)) {
							mediaSources[formAttribute as keyof MediaSources] = JRResourceURL.from(formValue);
						}
					}
				}
			});
		});

		return { chunks, mediaSources };
	});
};

type ComputedFormTextRange<Role extends TextRole> = Accessor<TextRange<Role, 'form'>>;

/**
 * Creates a text range (e.g. label or hint) from the provided definition, reactive to:
 *
 * - The form's current language (e.g. `<label ref="jr:itext('text-id')" />`)
 * - Direct `<output>` references within the label's children
 */
export const createTextRange = <Role extends TextRole>(
	context: EvaluationContext,
	role: Role,
	definition: TextRangeDefinition<Role>
): ComputedFormTextRange<Role> => {
	return context.scope.runTask(() => {
		const textChunksAccessor = createTextChunks(context, definition.chunks);

		return createMemo(() => {
			const chunks = textChunksAccessor();
			return new TextRange('form', role, chunks.chunks, chunks.mediaSources);
		});
	});
};
