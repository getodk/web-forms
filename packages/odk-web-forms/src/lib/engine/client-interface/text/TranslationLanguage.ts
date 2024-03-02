/**
 * TODO: this may better be expressed as a structured type, at least in part for
 * reasons discussed on {@link ActiveLanguage}.
 */
export type TranslationLanguage = string;

/**
 * TODO: technically a form's active language is (or at least will initially be)
 * nullable, i.e. for forms with no translations. `TranslationLanguage | null`
 * (which is presently `string | null`) type, while accurate, might be
 * misleading, and suggests client logic which doesn't make much sense (i.e. a
 * form will either always have an active language, or it never will; a client
 * should not need to handle a case where the active language is conditionally
 * set). It's worth considering a more structured type, which it's possible to
 * always provide a valid value, and where the absence of form translations can
 * be clearly identified here with a specific sentinel value/type.
 */
export type ActiveLanguage = TranslationLanguage | null;
