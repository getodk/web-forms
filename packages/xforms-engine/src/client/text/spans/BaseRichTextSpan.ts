import type { ActiveLanguage } from '../../FormLanguage.ts';
import type { RichText } from '../RichText.ts';
import type { RichTextUnit, RichTextUnitTypeSpan } from '../RichTextUnit.ts';

/**
 * Represents a substring of a {@link RichText} which has been computed, either
 * from:
 *
 * - some aspect of instance state (i.e. an
 *   {@link https://getodk.github.io/xforms-spec/#body-elements | `<output>` body element},
 *   which will recompute when the values of any referenced nodes are updated)
 *
 * - form-defined
 *   {@link https://getodk.github.io/xforms-spec/#languages | translation text}
 *   (which will the be recomputed when the form's {@link ActiveLanguage} is
 *   changed)
 *
 * - a combination of both (i.e. `<output>` in `<itext>` translations), which
 *   may be recomputed when states contributing to either are changed
 */
export type RichTextSpanVariantComputed = 'RICH_TEXT_SPAN_VARIANT_COMPUTED';

/**
 * Represents a structural subtree within a {@link RichText} which has
 * presentational semantics.
 *
 * Note: presentation is structured because several aspects of presentation may
 * be nested.
 *
 * @todo Markdown
 */
export type RichTextSpanVariantPresentation = 'RICH_TEXT_SPAN_VARIANT_PRESENTATION';

/**
 * Represents a substring of a {@link RichText} parsed from form-defined literal
 * text, which will not be recomputed throughout the lifetime of an active
 * instance (or a loaded form).
 */
export type RichTextSpanVariantLiteral = 'RICH_TEXT_SPAN_VARIANT_LITERAL';

// prettier-ignore
export type RichTextSpanVariant =
	| RichTextSpanVariantComputed
	| RichTextSpanVariantLiteral
	| RichTextSpanVariantPresentation;

export interface BaseRichTextSpan extends RichTextUnit {
	readonly type: RichTextUnitTypeSpan;
	readonly variant: RichTextSpanVariant;
	readonly presentation: string | null;
	readonly children: readonly BaseRichTextSpan[];
}
