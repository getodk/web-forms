import type { RichTextBlockVariant } from './BaseRichTextBlock.ts';
import type { RichTextLine } from './RichTextLine.ts';

interface RichTextBlockByVariantSuffix {
	readonly LINE: RichTextLine;
	/** ... pending Markdown support... */
}

// prettier-ignore
type RichTextBlockVariantSuffix<BlockVariant extends RichTextBlockVariant> =
	BlockVariant extends `RICH_TEXT_BLOCK_VARIANT_${infer Suffix}`
		? Suffix
		: never;

// prettier-ignore
export type RichTextBlock<
	BlockVariant extends RichTextBlockVariant = RichTextBlockVariant
> = RichTextBlockByVariantSuffix[RichTextBlockVariantSuffix<BlockVariant>];
