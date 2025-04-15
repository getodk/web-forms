import type { BaseRichTextBlock, RichTextBlockVariantLine } from './BaseRichTextBlock.ts';

export interface RichTextLine extends BaseRichTextBlock {
	readonly variant: RichTextBlockVariantLine;
}
