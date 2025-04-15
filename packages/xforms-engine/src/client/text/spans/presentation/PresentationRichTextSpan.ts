import type { BaseRichTextSpan, RichTextSpanVariantPresentation } from '../BaseRichTextSpan.ts';
import type { ComputedRichTextSpan } from '../ComputedRichTextSpan.ts';
import type { RichTextSpan } from '../RichTextSpan.ts';

/**
 * @see {@link RichTextPresentation}
 */
// prettier-ignore
type TemporarilyNever<T extends string> = Exclude<T, T>;

/**
 * @todo This would ideally be typed as `unknown` until we support Markdown,
 * but that would cause the nullable union in
 * {@link BaseRichTextSpan.presentation} to produce type/lint errors.
 */
// prettier-ignore
export type RichTextPresentation =
	// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
	| TemporarilyNever<'RICH_TEXT_PRESENTATION_TBD'>
	/** | ... */;

/**
 * @todo Represent presentational aspects of Markdown
 */
export interface PresentationRichTextSpan extends BaseRichTextSpan {
	readonly variant: RichTextSpanVariantPresentation;
	readonly presentation: RichTextPresentation;

	/**
	 * @todo When we support Markdown, it would probably be helpful to have
	 * examples similar to the one for {@link ComputedRichTextSpan} showing
	 * various ways it would comingle with {@link PresentationRichTextSpan}.
	 *
	 * - {@link PresentationRichTextSpan} as a sibling of
	 *   {@link ComputedRichTextSpan}, e.g.:
	 *
	 *   `<label>_a_ <output /> __b__</label>`
	 *
	 * - {@link PresentationRichTextSpan} as a parent of
	 *   {@link ComputedRichTextSpan}, e.g.:
	 *
	 *   `<label>## a <output /> b</label>`
	 *
	 * - {@link PresentationRichTextSpan} as a child of
	 *   {@link ComputedRichTextSpan}, e.g. (in itext):
	 *
	 *   `<text id="foo"><value>a _b_ c</value></text>`
	 */
	readonly children: readonly RichTextSpan[];
}
