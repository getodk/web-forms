export const ResultTypes = {
	BOOLEAN_TYPE: XPathResult.BOOLEAN_TYPE,
	NUMBER_TYPE: XPathResult.NUMBER_TYPE,
	STRING_TYPE: XPathResult.STRING_TYPE,
	UNORDERED_NODE_ITERATOR_TYPE: XPathResult.UNORDERED_NODE_ITERATOR_TYPE,
	ORDERED_NODE_ITERATOR_TYPE: XPathResult.ORDERED_NODE_ITERATOR_TYPE,
	UNORDERED_NODE_SNAPSHOT_TYPE: XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
	ORDERED_NODE_SNAPSHOT_TYPE: XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
	ANY_UNORDERED_NODE_TYPE: XPathResult.ANY_UNORDERED_NODE_TYPE,
	FIRST_ORDERED_NODE_TYPE: XPathResult.FIRST_ORDERED_NODE_TYPE,
} as const;

export type ResultTypes = typeof ResultTypes;

export type ResultType = ResultTypes[keyof ResultTypes];
