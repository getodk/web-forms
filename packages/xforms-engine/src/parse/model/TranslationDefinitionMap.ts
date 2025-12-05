import type { DOMItextTranslationElement } from '../XFormDOM.ts';

export interface ChunkExpressionsByItextId extends Map<string, Element> {}

const generateChunksForLanguage = (
	translationElement: DOMItextTranslationElement
): ChunkExpressionsByItextId => {
	return new Map(
		Array.from(translationElement.children).map((textElement) => {
			const itextId = textElement.getAttribute('id');
			return [itextId!, textElement] as const;
		})
	);
};

export class TranslationDefinitionMap extends Map<string, ChunkExpressionsByItextId> {
	constructor(translationElements: readonly DOMItextTranslationElement[]) {
		super(
			translationElements.map((translationElement) => {
				const lang = translationElement.getAttribute('lang');
				return [lang, generateChunksForLanguage(translationElement)] as const;
			})
		);
	}
}
