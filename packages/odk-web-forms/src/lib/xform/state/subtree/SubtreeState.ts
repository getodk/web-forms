import type {
	SubtreeNodeType,
	TypedSubtreeDefinition,
} from '../../model/subtree/SubtreeDefinition.ts';
import { DescendantNodeState } from '../DescendantNodeState.ts';
import type { EntryState } from '../EntryState.ts';
import { buildChildStates } from '../EntryState.ts';
import type { AnyChildState, AnyParentState, NodeState } from '../NodeState.ts';
import type { GroupSubtreeState } from './GroupSubtreeState.ts';
import type { ModelSubtreeState } from './ModelSubtreeState.ts';

export abstract class SubtreeState<SubtreeType extends SubtreeNodeType>
	extends DescendantNodeState<'subtree'>
	implements NodeState<'subtree'>
{
	abstract readonly subtreeType: SubtreeType;

	readonly children: readonly AnyChildState[];
	readonly valueState = null;
	readonly node: Element;

	constructor(
		entry: EntryState,
		override readonly parent: AnyParentState,
		definition: TypedSubtreeDefinition<SubtreeType>
	) {
		super(entry, parent, 'subtree', definition);

		const node = definition.node.cloneNode(false) as Element;

		parent.node.append(node);
		this.node = node;

		this.children = buildChildStates(entry, this as AnySubtreeState);
	}
}

export type AnySubtreeState = GroupSubtreeState | ModelSubtreeState;
