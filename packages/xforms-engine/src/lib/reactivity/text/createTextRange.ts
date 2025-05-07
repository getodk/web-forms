import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type { TextRole } from '../../../client/TextRange.ts';
import type { EvaluationContext } from '../../../instance/internal-api/EvaluationContext.ts';
import { TextChunk } from '../../../instance/text/TextChunk.ts';
import { TextRange } from '../../../instance/text/TextRange.ts';
import type { StaticElement } from '../../../integration/xpath/static-dom/StaticElement.ts';
import type { TextChunkExpression } from '../../../parse/expression/TextChunkExpression.ts';
import type { TextRangeDefinition } from '../../../parse/text/abstract/TextRangeDefinition.ts';
import { createComputedExpression } from '../createComputedExpression.ts';

interface TextContent {
	chunks: readonly TextChunk[];
	image: string | null;
}

const isFormAttribute = (attribute) => attribute?.qualifiedName?.localName === 'form';

const isDefaultValue = (item) => !item.attributes?.length;

const getImageValue = (item) => {
	if (isDefaultValue(item)) {
		return null;
	}

	const isImage = (attribute) => isFormAttribute(attribute) && attribute.value === 'image';
	return item.attributes.find(isImage) ? item.value : null;
};

/**
 * The function temporarily supports itext with multiple nested nodes.
 * TODO: Build support for <output> nodes.
 * 			 A child might be a node that needs XPath to compute its value. For that, the engine
 * 			 should create a {@link: TextElementDefinition}, so that createTextChunks function can
 * 			 request the computed value to XPath and create the TextChunk.
 */
const processChildrenValues = (item) => {
	let value = '';
	item.children?.forEach((child) => (value += child.value ?? ''));
	return value;
};

/**
 * Creates a reactive accessor for text chunks and an optional image from text source expressions.
 * - Combines chunks from literal and computed sources into a single array.
 * - Captures the first image found with a 'from="image"' attribute.
 *
 * @param context - The evaluation context for reactive computations.
 * @param textSources - Array of text source expressions to process.
 * @returns An accessor for an object with all chunks and the first image (if any).
 */
const createTextChunks = (
	context: EvaluationContext,
	textSources: readonly TextChunkExpression[]
): Accessor<TextContent> => {
	return createMemo(() => {
		const chunks: TextChunk[] = [];
		let image: string | null = null;

		textSources.forEach((textSource) => {
			if (textSource.source === 'literal') {
				chunks.push(new TextChunk(context, textSource.source, textSource.stringValue));
				return;
			}

			const computed = createComputedExpression(context, textSource)();
			const items = Array.isArray(computed) ? computed : [computed];

			items.forEach((item: StaticElement) => {
				if (textSource.resultType === 'string') {
					chunks.push(new TextChunk(context, textSource.source, item));
					return;
				}

				if (isDefaultValue(item)) {
					const value = item.value ?? processChildrenValues(item);
					chunks.push(new TextChunk(context, textSource.source, value));
					return;
				}

				// TODO: Add support for: video, audio, short, etc.
				image ??= getImageValue(item);
			});
		});

		return { chunks, image };
	});
};

type ComputedFormTextRange<Role extends TextRole> = Accessor<TextRange<Role, 'form'>>;

/**
 * Creates a text range (e.g. label or hint) from the provided definition, reactive to:
 *
 * - The form's current language (e.g. `<label ref="jr:itext('text-id')" />`)
 * - Direct `<output>` references within the label's children
 *
 * @todo This does not yet handle itext translations **with** outputs!
 */
export const createTextRange = <Role extends TextRole>(
	context: EvaluationContext,
	role: Role,
	definition: TextRangeDefinition<Role>
): ComputedFormTextRange<Role> => {
	return context.scope.runTask(() => {
		const textChunks = createTextChunks(context, definition.chunks);

		return createMemo(() => new TextRange('form', role, textChunks().chunks, textChunks().image));
	});
};
