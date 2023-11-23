import type { XFormDefinition } from '../XFormDefinition.ts';
import type { ReadonlyModelBindMap } from './ModelBindMap.ts';
import { ModelBindMap } from './ModelBindMap.ts';
import { RootDefinition } from './RootDefinition.ts';

export class ModelDefinition {
	readonly binds: ReadonlyModelBindMap;
	readonly root: RootDefinition;

	constructor(readonly form: XFormDefinition) {
		this.binds = ModelBindMap.fromModel(this);
		this.root = new RootDefinition(form, this);
	}

	toJSON() {
		const { form, ...rest } = this;

		return rest;
	}
}