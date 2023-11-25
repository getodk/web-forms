import type { XFormDefinition } from '../XFormDefinition.ts';
import { ModelBindMap } from './ModelBindMap.ts';
import { RootDefinition } from './RootDefinition.ts';

export class ModelDefinition {
	readonly binds: ModelBindMap;
	readonly root: RootDefinition;

	constructor(readonly form: XFormDefinition) {
		this.binds = ModelBindMap.fromModel(this);
		this.root = new RootDefinition(form, this);
	}

	toJSON() {
		const { binds, root } = this;

		return {
			binds: binds.toJSON(),
			root: root.toJSON(),
		};
	}
}
