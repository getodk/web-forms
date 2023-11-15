import type { XFormDefinition } from '../../XFormDefinition.ts';
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

	constructor(form: XFormDefinition, element: Element) {
		super(form, element);

		const reference = element.getAttribute('ref');

		if (reference == null) {
			throw new Error(`Invalid control: missing ref attribute`);
		}

		this.reference = reference;
		this.label = LabelDefinition.forElement(form, element);
		this.hint = HintDefinition.forElement(form, element);
	}
}
