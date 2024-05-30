import type { XFormDefinition } from '../../XFormDefinition.ts';
import type { ParsedTokenList } from '../../lib/TokenListParser.ts';
import type { BodyElementParentContext } from '../BodyDefinition.ts';
import { BodyElementDefinition } from '../BodyElementDefinition.ts';
import { HintDefinition } from '../text/HintDefinition.ts';
import { LabelDefinition } from '../text/LabelDefinition.ts';

// prettier-ignore
type ControlType =
	| 'input'
	| 'range'
	| 'rank'
	| 'select'
	| 'select1'
	| 'trigger'
	| 'upload';

export abstract class ControlDefinition<
	Type extends ControlType,
> extends BodyElementDefinition<Type> {
	override readonly category = 'control';
	abstract override readonly type: Type;
	override readonly reference: string;
	override readonly label: LabelDefinition | null;
	override readonly hint: HintDefinition | null;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	abstract readonly appearances: ParsedTokenList<any>;

	constructor(form: XFormDefinition, parent: BodyElementParentContext, element: Element) {
		super(form, parent, element);

		const reference = element.getAttribute('ref');

		if (reference == null) {
			throw new Error(`Invalid control: missing ref attribute`);
		}

		this.reference = reference;
		this.label = LabelDefinition.forControl(form, this);
		this.hint = HintDefinition.forElement(form, this);
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyControlDefinition = ControlDefinition<any>;
