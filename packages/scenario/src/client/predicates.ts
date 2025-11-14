import type { AnyNode, AttributeNode, RepeatRangeNode } from '@getodk/xforms-engine';

export const isRepeatRange = (node: AnyNode | AttributeNode): node is RepeatRangeNode => {
	return (
		node.nodeType === 'repeat-range:controlled' || node.nodeType === 'repeat-range:uncontrolled'
	);
};
