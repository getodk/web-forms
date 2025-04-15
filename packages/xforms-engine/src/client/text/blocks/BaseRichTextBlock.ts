import type { RichText } from '../RichText.ts';
import type { RichTextUnit, RichTextUnitTypeBlock } from '../RichTextUnit.ts';
import type { RichTextSpan } from '../spans/RichTextSpan.ts';

/**
 * Represents an individual line of text in a {@link RichText}.
 *
 * @todo This may be short lived? Evidently Collect's Markdown implementation
 * only supports headings and paragraphs. It has no equivalent to `<br>`!
 */
export type RichTextBlockVariantLine = 'RICH_TEXT_BLOCK_VARIANT_LINE';

// prettier-ignore
export type RichTextBlockVariant =
	| RichTextBlockVariantLine
	/* | ... this will be expanded when we support parsing Markdown */;

export interface BaseRichTextBlock extends RichTextUnit {
	readonly type: RichTextUnitTypeBlock;
	readonly variant: RichTextBlockVariant;
	readonly children: readonly [RichTextSpan, ...RichTextSpan[]];
}
