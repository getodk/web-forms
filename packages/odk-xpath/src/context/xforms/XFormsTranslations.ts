import { UpsertableWeakMap } from '../../lib/collections/UpsertableWeakMap.ts';

type ItextForm = string;

class TranslationItextFormsMap extends Map<string | null, string> {
	constructor(
		protected readonly primaryValue: string,
		itextFormValues: Iterable<readonly [ItextForm, string]> = []
	) {
		super([[null, primaryValue], ...itextFormValues]);
	}

	override get(form: string): string | undefined {
		return super.get(form);
	}

	override toString(): string {
		return this.primaryValue;
	}
}

/**
 * Currently only supports producing a "regular" value (i.e. from a
 * `<itext><text><value>...` without an explicit `form` attribute).
 *
 * Per discussion with lognaturel, for normal display cases it is always
 * expected that the "regular" value will be displayed by default in both
 * `<hint>`s and `<label>`s. The ODK spec currently introduces some amgibuity
 * where it might be mistakenly assumed that a single itext `<text>` with both a
 * "regular" `<value>` and a `<value form="guidance">` may display the latter
 * for a `<hint>`, but that isn't actually the expected behavior.
 */
class TranslationText {
	readonly id: string;
	readonly itextForms: TranslationItextFormsMap;
	readonly primaryvalue: string;

	constructor(text: Element) {
		const { id } = text;

		if (id == null || id === '') {
			throw new Error('Translation <text> missing id');
		}

		this.id = id;

		let primaryValue: string | null = null;

		const formValues = new Map<string, string>();

		for (const element of text.querySelectorAll(':scope > value')) {
			const form = element.getAttribute('form');
			const value = element.textContent!;

			if (form == null) {
				primaryValue = value;

				continue;
			}

			if (formValues.has(form)) {
				throw new Error(`Multiple values of form ${form}`);
			} else {
				formValues.set(form, value);
			}
		}

		if (primaryValue == null) {
			throw new Error('No <value> for translation <text>');
		}

		this.primaryvalue = primaryValue;
		this.itextForms = new TranslationItextFormsMap(primaryValue, formValues);
	}

	toString() {
		return this.primaryvalue;
	}
}

type TranslationLanguage = string;

class Translation {
	readonly isExplicitDefault: boolean;
	readonly language: TranslationLanguage;
	readonly textValues: ReadonlyMap<string, TranslationText>;

	constructor(translation: Element) {
		const defaultAttr = translation.getAttribute('default');
		const isExplicitDefault = defaultAttr != null;

		this.isExplicitDefault = isExplicitDefault;

		if (isExplicitDefault && defaultAttr !== 'true()' && defaultAttr !== '') {
			console.warn('Unusual translation default attribute value', defaultAttr);
		}

		const language = translation.getAttribute('lang');

		if (language == null) {
			throw new Error('Translation language not specified');
		}

		this.language = language;

		const textElements = Array.from(translation.querySelectorAll(':scope > text[id]'));
		const textValues = new Map<string, TranslationText>(
			textElements.map((element) => {
				const text = new TranslationText(element);

				return [text.id, text];
			})
		);

		this.textValues = textValues;
	}

	itext(id: string): string {
		return this.textValues.get(id)?.primaryvalue ?? '';
	}
}

class NotFoundTranslation implements Translation {
	readonly isExplicitDefault = false;

	get language(): TranslationLanguage {
		throw new Error('Not a translation');
	}

	get textValues(): ReadonlyMap<string, TranslationText> {
		throw new Error('Not a translation');
	}

	itext(): string {
		throw new Error('Not a translation');
	}
}

const xformsTranslations = new UpsertableWeakMap<Element, XFormsTranslations>();

export class XFormsTranslations {
	static from(model: Element, currentLanguage: string | null): XFormsTranslations {
		const translations = xformsTranslations.upsert(model, () => new this(model));
		translations.setLanguage(currentLanguage);

		return translations;
	}

	protected readonly byLanguage: ReadonlyMap<TranslationLanguage, Translation>;
	protected readonly defaultLanguage: Translation;

	protected currentLanguage: Translation;

	protected constructor(model: Element) {
		const translations = Array.from(
			model.querySelectorAll(':scope > itext > translation[lang]')
		).map((element) => {
			return new Translation(element);
		});
		const byLanguage = new Map<TranslationLanguage, Translation>(
			translations.map((translation) => [translation.language, translation])
		);

		const defaultTranslations = translations.filter((translation) => translation.isExplicitDefault);

		if (defaultTranslations.length > 1) {
			const defaultLanguages = defaultTranslations.map(({ language }) => language);

			throw new Error(`Multiple default translations: ${defaultLanguages.join(', ')}`);
		}

		this.byLanguage = byLanguage;

		const defaultLanguage = defaultTranslations[0] ?? translations[0] ?? new NotFoundTranslation();

		this.defaultLanguage = defaultLanguage;
		this.currentLanguage = defaultLanguage;
	}

	itext(id: string): string {
		return this.currentLanguage.textValues.get(id)?.primaryvalue ?? '';
	}

	setLanguage(language: TranslationLanguage | null): Translation {
		const translation = language == null ? this.defaultLanguage : this.byLanguage.get(language);

		if (translation == null) {
			throw new Error(`Language not supported: ${language}`);
		}

		this.currentLanguage = translation;

		return translation;
	}
}
