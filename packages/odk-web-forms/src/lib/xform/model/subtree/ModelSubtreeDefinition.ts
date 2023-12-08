import type { BindDefinition } from '../BindDefinition.ts';
import type { ParentNodeDefinition } from '../NodeDefinition.ts';
import { SubtreeDefinition } from './SubtreeDefinition.ts';

export class ModelSubtreeDefinition extends SubtreeDefinition<'model'> {
	override readonly subtreeType = 'model';
	override readonly bodyElement = null;

	constructor(parent: ParentNodeDefinition, bind: BindDefinition, node: Element) {
		super(parent, bind, null, node);
	}
}
