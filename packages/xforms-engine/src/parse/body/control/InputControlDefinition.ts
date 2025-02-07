import type { XFormDefinition } from '../../XFormDefinition.ts';
import type { InputAppearanceDefinition } from '../appearance/inputAppearanceParser.ts';
import { inputAppearanceParser } from '../appearance/inputAppearanceParser.ts';
import type { BodyElementParentContext } from '../BodyDefinition.ts';
import { ControlDefinition } from './ControlDefinition.ts';

// ToDo: Move to a better place. /src/lib/NodeOptionsParser.ts?
const parseInteger = (value: string | null) => {
	const parsed = Number(value);
	if (!Number.isInteger(parsed)) {
		throw new Error(`Expected an integer, but got: ${value}`);
	}
	return parsed;
};

// ToDo: Move to a better place. /src/lib/NodeOptionsParser.ts?
const parseFloatStrict = (value: string | null) => {
	const parsed = Number(value);
	if (isNaN(parsed)) {
		throw new Error(`Expected a float, but got: ${value}`);
	}
	return parsed;
};

export class InputControlDefinition extends ControlDefinition<'input'> {
	static override isCompatible(localName: string): boolean {
		return localName === 'input';
	}

	readonly type = 'input';
	readonly appearances: InputAppearanceDefinition;
	readonly rows: number | null;
	readonly accuracyThreshold: number | null;
	readonly unacceptableAccuracyThreshold: number | null;

	constructor(form: XFormDefinition, parent: BodyElementParentContext, element: Element) {
		super(form, parent, element);

		this.appearances = inputAppearanceParser.parseFrom(element, 'appearance');
		this.rows = parseInteger(element.getAttribute('rows'));
		this.accuracyThreshold = parseFloatStrict(element.getAttribute('accuracyThreshold'));
		this.unacceptableAccuracyThreshold = parseFloatStrict(
			element.getAttribute('unacceptableAccuracyThreshold')
		);
	}
}
