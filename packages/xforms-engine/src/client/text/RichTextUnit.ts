import type { InstanceNode } from '../../instance/abstract/InstanceNode.ts';
import type { StaticNode } from '../../integration/xpath/static-dom/StaticNode.ts';
import type { BaseNode } from '../BaseNode.ts';
import type { RichText } from './RichText.ts';

export type RichTextUnitTypeBlock = 'RICH_TEXT_UNIT_TYPE_BLOCK';
export type RichTextUnitTypeSpan = 'RICH_TEXT_UNIT_TYPE_SPAN';

// prettier-ignore
export type RichTextUnitType =
	| RichTextUnitTypeBlock
	| RichTextUnitTypeSpan;

/**
 * @todo [Design review detail, remove before implementation.]
 *
 * This is kind of an awkward name! The concept is effectively a "node", and
 * {@link RichText} effexctively forms a "tree of nodes". In that light, it was
 * tempting to name this `RichTextNode`. I worry that might cause confusion
 * where there are several other concepts with "node"-based naming, where that
 * naming already has overloaded implications, i.e.:
 *
 * - Client-facing: {@link BaseNode} (and its subtypes). This naming scheme is
 *   **descriptive**, with the intent to convey to clients that an instance
 *   itself is modeled and has the semantics of a tree of nodes.
 *
 * - Internal class hierarchies:
 *     - {@link InstanceNode} (and its subclasses)
 *     - {@link StaticNode} (and its subclasses)
 *
 *     These cases are descriptive like their client-facing counterparts, but
 *     they also convey "node"-ness in terms of spec concepts (as specified by
 *     ODK XForms, XPath, XML).
 *
 * Furthermore, while we strive to _simplify_ spec concepts at the engine/client
 * boundary, we also tend to adopt names corresponding to _spec concepts_. As
 * such, it would be _reasonable_ for a client integrator to _assume_ that the
 * client-facing nodes have roughly the same spec implications as their internal
 * counterparts.
 *
 * **HOWEVER:** the above is notably **NOT** a reasonable assumption for
 * {@link RichTextUnit} and its subtypes! The interfaces necessarily have some
 * relation to their spec counterparts, but there are several ways that they
 * diverge _in order to present a simpler model to clients_. Importantly: at
 * least for now and the foreseeable future, we **DO NOT** expect to be able to
 * use a {@link RichTextUnit} or any of its subtypes as, say, XPath evaluation
 * context nodes. In fact, they will frequently be a _product of XPath
 * evaluations_! So some caution is warrranted about whether a name like
 * `RichTextNode` might inspire unintended assumptions.
 *
 * There is also a social (team/contributor) caution: do **we** feel comfortable
 * tossing another "node" concept into the proverbial "node soup"? Will **we**
 * understand what it means (and more importantly _doesn't mean_) in the coming
 * months... or years?
 *
 * If we have consensus on these cautions:
 *
 * 1. Is "unit" a reasonable substitution for what is naturally a "node"?
 * 2. Would we prefer to make other naming revisions to further distance the
 *    concept from "node"-ness? I.e. should we consider another name for
 *    {@link children}? For example: in an earlier iteration of this design
 *    proposal, the property was named `spans`—which recognized that any "unit
 *    with children" (née "parent node") would only ever contain "span"
 *    children.
 */
export interface RichTextUnit {
	readonly type: RichTextUnitType;

	/**
	 * Represents variants of a given {@link RichTextUnitType | unit type}, to be
	 * defined and narrowed within the subtypes of each.
	 */
	readonly variant: unknown;

	get children(): readonly RichTextUnit[];

	/**
	 * Represents the text value—as parsed and/or in its present computed
	 * state—with any formatting syntax removed or reprocessed; i.e. producing a
	 * string suitable for presentation to a user where "rich" or "formatted" text
	 * are unsuitable.
	 *
	 * **WARNING:** This value may be computed from several sources (e.g.
	 * `jr:itext()`, `<output>`, inline text), and may be recomputed more
	 * frequently than its {@link children | structured counterpart}.
	 */
	get plainText(): string;

	/**
	 * Represents the raw source text—as parsed and/or in its present computed
	 * state—without any further processing.
	 *
	 * **WARNING:**
	 *
	 * - The raw text value is exposed for non-presentational use cases (e.g.
	 *   testing). Clients wishing to present text values _without formatting_ are
	 *   strongly encouraged to reference {@link plainText} instead.
	 *
	 * - This value may be computed from several sources (e.g. `jr:itext()`,
	 *   `<output>`, inline text), and may be recomputed more frequently than its
	 *   {@link children | structured counterpart}.
	 *
	 *
	 * @todo [Design review detail, remove before implementation.]
	 *
	 * Do we actually want to expose this? The most likely use case would be
	 * testing. The risk of exposing it is that it could encourage conflicting or
	 * divergent implementations of ODK's flavor of Markdown (diverging in terms
	 * of parsing, semantics, capabilities, and so on).
	 */
	get rawText(): string;
}
