import type { PartiallyKnownString } from '@getodk/common/types/string/PartiallyKnownString.ts';
import type { ActiveLanguage } from '../FormLanguage.ts';
import type { RankItem } from '../RankNode.ts';
import type { SelectItem } from '../SelectNode.ts';
import type { RichTextMedia } from './RichTextMedia.ts';
import type { RichTextSection } from './RichTextSection.ts';

/**
 * Specifies that a {@link RichText} is parsed and computed from aspects of the
 * form definition.
 *
 * Clients should present such {@link RichText}, as appropriate for their user
 * experience, as they are computed.
 */
export type RichTextSourceForm = 'RICH_TEXT_SOURCE_FORM';

/**
 * Specifies that a {@link RichText} is derived from a _form-defined value_,
 * where an accompanying {@link RichTextSourceForm | form-defined source} is not
 * available. This may be encountered for
 * {@link SelectItem.label | select item labels} and
 * {@link RankItem.label | rank item labels}.
 *
 * Clients are encouraged to present such {@link RichText} to users where a
 * presentation is equivalent, but may opt to present other fallback content in
 * its place as suitable for their users.
 */
export type RichTextSourceValue = 'RICH_TEXT_SOURCE_VALUE';

/**
 * Specifies that a {@link RichText} is produced from an _engine-defined
 * constant_ or sentinel value, where neither a
 * {@link RichTextSourceForm | form-defined source} nor a
 * {@link RichTextSourceValue | value-derived source} is available. This may be
 * encountered in {@link ViolationMessage | validation violation messages}.
 *
 * Clients are encouraged to reference these engine-defined constants as keys,
 * which can be mapped to text suitable for conveying the condition to users
 * (and which may be translated by the client as appropriate for the form's
 * {@link ActiveLanguage}).
 */
export type RichTextSourceEngine = 'RICH_TEXT_SOURCE_ENGINE';

// prettier-ignore
export type RichTextSource =
	| RichTextSourceEngine
	| RichTextSourceForm
	| RichTextSourceValue;

/**
 * @todo If we decide to use the same type-level representation **and** parsing
 * logic for {@link RichText.media}, we may also want to make the following
 * changes here:
 *
 * - Default {@link AlternatesKey} to `string`
 * - Always produce a (non-nullable) {@link Record}
 * - Key by {@link PartiallyKnownString<AlternatesKey>}
 */
// prettier-ignore
export type RichTextAlternateSections<AlternatesKey extends string = never> =
	[AlternatesKey] extends [never]
		? null
		: Readonly<Record<AlternatesKey, RichTextSection | null>>;

export interface RichText<AlternatesKey extends string = never> {
	readonly source: RichTextSource;

	/**
	 * @todo Collect only supports media with `<label>`s. Some ways we could
	 * address consistency:
	 *
	 * - This property could be made optional-by-type-param, with a similar
	 *   mechanism to the `never` check used by
	 *   {@link alternates}/{@link RichTextAlternateSections}.
	 *
	 * - We could have the same type-level representation, but skip media parsing
	 *   logic for non-`<label>` cases (they'd be populated as `null`).
	 *
	 * - We could use the same type-level representation **and** parsing logic,
	 *   and _clients_ could decide which {@link RichText} use cases should
	 *   present media.
	 */
	readonly media: RichTextMedia;

	get blocks(): RichTextSection | null;
	get alternates(): RichTextAlternateSections<AlternatesKey>;
}
