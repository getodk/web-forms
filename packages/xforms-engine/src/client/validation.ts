import type { TextRange } from './TextRange.ts';
import type { AnyChildNode } from './hierarchy.ts';

/**
 * Specifies the unambiguous validity state for each validity condition of a
 * given node, or for the derived validity of any parent node whose descendants
 * are validated.
 *
 * For {@link ValidationCondition | form-defined conditions}, validity is
 * determined as follows:
 *
 *
 *   expression | state     |  blank  | non-blank
 * ------------:|:----------|:-------:|:---------:
 * `constraint` | `true`\*  | ✅      | ✅
 * `constraint` | `false`   | ✅      | ❌
 * `required`   | `false`\* | ✅      | ✅
 * `required`   | `true`    | ❌      | ✅
 *
 * - \* = default (expression not defined)
 * - ✅ = 'satisfied'
 * - ❌ = 'violation'
 */
export type Validity = 'satisfied' | 'violation';

/**
 * Form-defined conditions which determine node validity.
 *
 * @see {@link https://getodk.github.io/xforms-spec/#bind-attributes | `constraint` and `required` bind attributes}
 */
export type ValidationCondition = 'constraint' | 'required';

/**
 * Source of a condition's violation message.
 *
 * - Form-defined messages (specified by the
 *   {@link https://getodk.github.io/xforms-spec/#bind-attributes | `jr:constraintMsg` and `jr:requiredMsg`}
 *   attributes) will be favored when provided by the form, and will be
 *   translated according to the form's active language (where applicable).
 *
 * - Otherwise, an engine-defined message will be provided as a fallback. This
 *   fallback is provided mainly for API consistency, and may be referenced for
 *   testing purposes; user-facing clients are expected to provide fallback
 *   messaging language most appropriate for their user neeeds. Engine-defined
 *   fallback messages **are not translated**. The specific messaging text to be
 *   provided is TBD, but will be made available in a referenceable format
 *   suitable for mapping to client-based translation solutions.
 */
// eslint-disable-next-line @typescript-eslint/sort-type-constituents
export type ViolationMessageSource = 'form' | 'engine';

/**
 * A violation message is provided for every violation of a form-defined
 * {@link ValidationCondition}.
 */
export interface ViolationMessage<Condition extends ValidationCondition>
	extends TextRange<Condition> {
	readonly messageSource: ViolationMessageSource;
}

export interface ConditionSatisfied<Condition extends ValidationCondition> {
	readonly condition: Condition;
	readonly validity: 'satisfied';
	readonly message: null;
}

export interface ConditionViolation<Condition extends ValidationCondition> {
	readonly condition: Condition;
	readonly validity: 'violation';
	readonly message: ViolationMessage<Condition>;
}

export type ConditionValidation<Condition extends ValidationCondition> =
	| ConditionSatisfied<Condition>
	| ConditionViolation<Condition>;

export type AnyViolation = ConditionViolation<ValidationCondition>;

export interface LeafNodeValidationState {
	get constraint(): ConditionValidation<'constraint'>;
	get required(): ConditionValidation<'required'>;

	/**
	 * Violations are mutually exclusive:
	 *
	 * - {@link constraint} can only be violated by a non-blank value
	 * - {@link required} can only be violated by a blank value
	 *
	 * As such, at most one violation can be present. If none is present,
	 * the node is considered valid.
	 */
	get violation(): AnyViolation | null;
}

interface ChildNodeViolation {
	readonly nodeId: string;

	get reference(): string;
	get node(): AnyChildNode;
	get violation(): AnyViolation;
}

export interface ParentNodeValidationState {
	get violations(): readonly ChildNodeViolation[];
}

export type NodeValidationState = LeafNodeValidationState | ParentNodeValidationState;
