import type { RichTextSpanVariant } from './BaseRichTextSpan.ts';
import type { ComputedRichTextSpan } from './ComputedRichTextSpan.ts';
import type { LiteralRichTextSpan } from './LiteralRichTextSpan.ts';
import type { PresentationRichTextSpan } from './presentation/PresentationRichTextSpan.ts';

interface RichTextSpanByVariantSuffix {
	readonly COMPUTED: ComputedRichTextSpan;
	readonly LITERAL: LiteralRichTextSpan;
	readonly PRESENTATION: PresentationRichTextSpan;
}

// prettier-ignore
type RichTextSpanVariantSuffix<SpanVariant extends RichTextSpanVariant> =
	SpanVariant extends `RICH_TEXT_SPAN_VARIANT_${infer Suffix}`
		? Suffix
		: never;

// prettier-ignore
export type RichTextSpan<
	SpanVariant extends RichTextSpanVariant = RichTextSpanVariant
> = RichTextSpanByVariantSuffix[RichTextSpanVariantSuffix<SpanVariant>];
