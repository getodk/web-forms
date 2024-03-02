import type { XFormDefinition } from '../XFormDefinition.ts';
import type { BodyDefinition } from '../body/BodyDefinition.ts';
import { ModelBindMap } from './ModelBindMap.ts';
import { RootDefinition } from './RootDefinition.ts';

export class ModelDefinition {
	readonly binds: ModelBindMap;
	readonly root: RootDefinition;

	constructor(
		readonly form: XFormDefinition,
		body: BodyDefinition
	) {
		this.binds = ModelBindMap.fromModel(this);
		this.root = new RootDefinition(form, this, body);
	}

	toJSON() {
		const { form, ...rest } = this;

		return rest;
	}
}
