import type { Accessor, Setter, Signal } from 'solid-js';
import { createSignal } from 'solid-js';
import type { XFormEntry } from './XFormEntry.ts';

export interface FormTranslationState {
	readonly isTranslated: true;
	currentLanguage(): string;
	readonly defaultLanguage: string;
	readonly languages: readonly [string, ...string[]];
}

const isNonEmpty = <T>(values: readonly T[]): values is readonly [T, ...T[]] => {
	return values.length > 0;
};

export class XFormEntryTranslations {
	static forEntry(
		entry: XFormEntry,
		initialLanguage?: string | null
	): XFormEntryTranslations | null {
		const { defaultLanguage, languages, isTranslated } = entry.form.model.translations;

		if (defaultLanguage != null && isTranslated && isNonEmpty(languages)) {
			const entryTranslations = new this(entry, languages, defaultLanguage);

			if (initialLanguage != null) {
				entryTranslations.setLanguage(initialLanguage);
			}

			return entryTranslations;
		}

		return null;
	}

	protected readonly selectedLanguage: Signal<string>;
	protected readonly selectedLanguageGetter: Accessor<string>;
	protected readonly selectedLanguageSetter: Setter<string>;

	readonly isTranslated = true;

	protected constructor(
		protected readonly entry: XFormEntry,
		protected readonly languages: readonly [string, ...string[]],
		protected readonly defaultLanguage: string
	) {
		const selectedLanguage = createSignal(defaultLanguage);
		const [selectedLanguageGetter, selectedLanguageSetter] = selectedLanguage;

		this.selectedLanguage = selectedLanguage;
		this.selectedLanguageGetter = selectedLanguageGetter;
		this.selectedLanguageSetter = selectedLanguageSetter;
	}

	getLanguage(): string {
		return this.selectedLanguageGetter();
	}

	getLanguages(): readonly [string, ...string[]] {
		return this.languages;
	}

	setLanguage(language: string): string {
		if (this.languages.includes(language)) {
			this.entry.instanceDOM.primaryInstanceEvaluator.setCurrentLanguage(language);

			return this.selectedLanguageSetter(language);
		}

		throw new Error(`Language not supported: ${language}`);
	}
}
