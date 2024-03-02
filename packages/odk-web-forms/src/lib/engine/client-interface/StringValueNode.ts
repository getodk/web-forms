import type { ValueNode } from './ValueNode.ts';

/**
 * The web-forms engine's representation of a {@link ValueNode} with a string
 * value type (which may or may not correspond to an XForms `<input>`; it may
 * alternatively correspond to a node with only a model value, typical of
 * e.g. `calculate`s).
 */
export interface StringValueNode extends ValueNode<string> {}
