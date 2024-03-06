import type { NonRepeatGroupElementDefinition } from '../../xform/body/BodyDefinition.ts';
import type { SubtreeDefinition } from '../../xform/model/SubtreeDefinition.ts';
import type { SubtreeNode } from './SubtreeNode.ts';

interface GroupDefinition extends SubtreeDefinition {
	readonly bodyElement: NonRepeatGroupElementDefinition;
}

export interface GroupNode extends SubtreeNode {
	readonly definition: GroupDefinition;
}
