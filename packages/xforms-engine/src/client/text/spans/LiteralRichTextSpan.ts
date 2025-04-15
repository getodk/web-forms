import type { RichTextUnit } from '../RichTextUnit.ts';
import type { BaseRichTextSpan, RichTextSpanVariantLiteral } from './BaseRichTextSpan.ts';

export interface LiteralRichTextSpan extends BaseRichTextSpan {
	readonly variant: RichTextSpanVariantLiteral;
	readonly presentation: null;
	readonly children: readonly [];
	readonly plainText: string;

	/**
	 * @todo This references the same type on {@link RichTextUnit} so that, if we
	 * decide to remove that property there, a type error will be produced here
	 * (ensuring we also remove it here).
	 */
	readonly rawText: RichTextUnit['rawText'];
}
