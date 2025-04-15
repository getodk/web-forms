import type { RichTextBlock } from './blocks/RichTextBlock.ts';

interface BaseRichTextSection {
	readonly isBlank: boolean;
	get blocks(): readonly [RichTextBlock, ...RichTextBlock[]] | null;
}

interface BlankRichTextSection extends BaseRichTextSection {
	readonly isBlank: true;
	get blocks(): null;
}

interface NonBlankRichTextSection extends BaseRichTextSection {
	readonly isBlank: false;
	get blocks(): readonly [RichTextBlock, ...RichTextBlock[]];
}

// prettier-ignore
export type RichTextSection =
	| BlankRichTextSection
	| NonBlankRichTextSection;
