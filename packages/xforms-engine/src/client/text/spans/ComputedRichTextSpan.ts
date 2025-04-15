import type { BaseRichTextSpan, RichTextSpanVariantComputed } from './BaseRichTextSpan.ts';
import type { RichTextSpan } from './RichTextSpan.ts';

export interface ComputedRichTextSpan extends BaseRichTextSpan {
	readonly variant: RichTextSpanVariantComputed;
	readonly presentation: null;

	/**
	 * Note: a {@link ComputedRichTextSpan} may have children, some of which may
	 * be (or contain) other {@link ComputedRichTextSpan}s!
	 *
	 * For example, a form definition with the following...
	 *
	 * ```xml
	 * <model>
	 *   <itext>
	 *     <translation lang="Foo">
	 *       <text id="bar">
	 *         <value>a <output value="/data/b" /> c</value>
	 *       </text>
	 *     </translation>
	 *   </itext>
	 *   <instance>
	 *     <data>
	 *       <b>default value of /data/b</b>
	 *     </data>
	 *   </instance>
	 * </model>
	 * <-- ... snip ... -->
	 * <input
	 * <label ref="jr:itext('bar')" />
	 * ```
	 *
	 * ... would produce a structure like:
	 *
	 * ```json
	 * {
	 *   "variant": "RICH_TEXT_SPAN_VARIANT_COMPUTED",
	 *   "children": [
	 *     {
	 *       "variant": "RICH_TEXT_SPAN_VARIANT_COMPUTED",
	 *       "children": [],
	 *       "plainText": "a "
	 *     },
	 *     {
	 *       "variant": "RICH_TEXT_SPAN_VARIANT_COMPUTED",
	 *       "children": [],
	 *       "plainText": "default value of /data/b"
	 *     },
	 *     {
	 *       "variant": "RICH_TEXT_SPAN_VARIANT_COMPUTED",
	 *       "children": [],
	 *       "plainText": " c"
	 *     },
	 *   ]
	 * }
	 * ```
	 *
	 * @todo Writing out the above example suggests splitting "computed" into
	 * parent and leaf variants. Using an empty `children` array to branch on that
	 * would be a pretty serious footgun!
	 */
	readonly children: readonly RichTextSpan[];
}
