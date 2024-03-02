// eslint-disable-next-line @typescript-eslint/no-unused-vars -- referenced in JSDoc
import type { FormNode } from './FormNode.ts';
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- referenced in JSDoc
import type { OpaqueReactiveObjectFactory } from './state/OpaqueReactiveObjectFactory.ts';

/**
 * Base interface for properties of a {@link FormNode} which change over time
 * (i.e. those which are reactive in clients providing a
 * {@link OpaqueReactiveObjectFactory}.)
 */
export interface FormNodeState {
	/**
	 * Location path reference to the node's primary instance state. This property
	 * may change if a node's position changes, e.g. when a repeat instance is
	 * removed. Its potential reactivity allows nodes to re-run computations which
	 * depend on the node's position itself, or when any other relative reference
	 * might target different nodes as a result of the positional change.
	 *
	 * @example
	 * /data/repeat[1]/foo
	 * /data/repeat[2]/foo
	 */
	get reference(): string;

	/**
	 * @default {false}
	 */
	get readonly(): boolean;

	/**
	 * @default {true}
	 */
	get relevant(): boolean;

	/**
	 * @default {false}
	 */
	get required(): boolean;
}
