import type { XFormDefinition } from './XFormDefinition.ts';
import type { ReadonlyXFormModelBindMap } from './XFormModelBindMap.ts';
import { XFormModelBindMap } from './XFormModelBindMap.ts';
import { XFormTranslations } from './XFormTranslations.ts';

export interface XFormModelDefinitionCommonElements {
	readonly model: Element;
	readonly primaryInstance: Element;
	readonly primaryInstanceRoot: Element;
}

export class XFormModelDefinition {
	readonly binds: ReadonlyXFormModelBindMap;
	readonly translations: XFormTranslations;

	constructor(readonly form: XFormDefinition) {
		this.binds = XFormModelBindMap.fromModel(this);
		this.translations = new XFormTranslations(this);
	}

	toJSON() {
		const { form, ...rest } = this;

		return rest;
	}
}
