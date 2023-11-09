import type { XFormModelDefinition } from './XFormModelDefinition.ts';

interface TranslationElement extends Element {
	getAttribute(name: 'lang'): string;
	getAttribute(name: string): string | null;
}

export class XFormTranslations {
	readonly isTranslated: boolean;

	readonly defaultLanguage: string | null;
	readonly languages: readonly string[];

	constructor(readonly model: XFormModelDefinition) {
		const { xformDOM } = model.form;
		const translationElements = xformDOM.rootEvaluator.evaluateNodes<TranslationElement>(
			'/h:html/h:head/xf:model/xf:itext/xf:translation[@lang]'
		);

		const isTranslated = translationElements.length > 0;

		this.isTranslated = isTranslated;

		if (!isTranslated) {
			this.defaultLanguage = null;
			this.languages = [];

			return;
		}

		const languages = translationElements.map((translation) => translation.getAttribute('lang'));
		const defaultLanguageIndex = Math.max(
			0,
			translationElements.findIndex((element) => element.hasAttribute('default'))
		);

		this.defaultLanguage = languages[defaultLanguageIndex] ?? null;
		this.languages = languages;
	}

	toJSON() {
		const { model, ...rest } = this;

		return rest;
	}
}
