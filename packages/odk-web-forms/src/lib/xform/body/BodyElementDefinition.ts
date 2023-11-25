import type { XFormDefinition } from '../XFormDefinition.ts';
import type { HintDefinition } from './text/HintDefinition.ts';
import type { LabelDefinition } from './text/LabelDefinition.ts';

export interface BodyElementSerialization {
	readonly category: string;
	readonly type: string;
	readonly reference: string | null;
	readonly hint: boolean;
	readonly label: boolean;
}

/**
 * These category names roughly correspond to each of the ODK XForms spec's
 * {@link https://getodk.github.io/xforms-spec/#body-elements | Body Elements}
 * tables.
 */
type BodyElementCategory = 'control' | 'structure' | 'support' | 'UNSUPPORTED';

export abstract class BodyElementDefinition<Type extends string> {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	static isCompatible(localName: string, element: Element): boolean {
		throw new Error('Must be overridden by BodyElementDefinition subclass');
	}

	abstract readonly category: BodyElementCategory;
	abstract readonly type: Type;
	readonly hint: HintDefinition | null = null;
	readonly label: LabelDefinition | null = null;
	readonly reference: string | null = null;

	protected constructor(
		protected readonly form: XFormDefinition,
		protected readonly element: Element
	) {}

	toJSON(): BodyElementSerialization {
		const { category, type, reference, hint, label } = this;

		return {
			category,
			type,
			reference,
			hint: hint != null,
			label: label != null,
		};
	}
}

type BodyElementDefinitionClass = Pick<
	typeof BodyElementDefinition,
	keyof typeof BodyElementDefinition
>;

// prettier-ignore
export type BodyElementDefinitionConstructor =
	& BodyElementDefinitionClass
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	& (new (form: XFormDefinition, element: Element) => BodyElementDefinition<any>);

type BodyElementDefinitionInstance = InstanceType<BodyElementDefinitionConstructor>;

export type TypedBodyElementDefinition<Type extends string> = Extract<
	BodyElementDefinitionInstance,
	{ readonly type: Type }
>;
