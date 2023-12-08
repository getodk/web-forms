import type { NonRepeatGroupElementDefinition } from '../../body/BodyDefinition';
import type { BindDefinition } from '../BindDefinition.ts';
import type { ParentNodeDefinition } from '../NodeDefinition.ts';
import { SubtreeDefinition } from './SubtreeDefinition.ts';

export class GroupSubtreeDefinition extends SubtreeDefinition<'group'> {
	override readonly subtreeType = 'group';

	constructor(
		parent: ParentNodeDefinition,
		bind: BindDefinition,
		override readonly bodyElement: NonRepeatGroupElementDefinition,
		node: Element
	) {
		super(parent, bind, null, node);
	}
}
