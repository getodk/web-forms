import { type ParsedTokenList, TokenListParser } from '../../../lib/TokenListParser.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import type { BodyElementParentContext } from '../BodyDefinition.ts';
import { ControlDefinition } from './ControlDefinition.ts';

const geoAppearanceParser = new TokenListParser(['placement-map', 'maps']);

type GeoAppearanceDefinition = ParsedTokenList<typeof geoAppearanceParser>;

export class GeoControlDefinition extends ControlDefinition<'input'> {
	static override isCompatible(localName: string): boolean {
		return localName === 'input';
	}

	readonly type = 'input';
	readonly appearances: GeoAppearanceDefinition;

	constructor(form: XFormDefinition, parent: BodyElementParentContext, element: Element) {
		super(form, parent, element);

		this.appearances = geoAppearanceParser.parseFrom(element, 'appearance');
	}
}
