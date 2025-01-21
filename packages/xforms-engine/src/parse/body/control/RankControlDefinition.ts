import type { LocalNamedElement } from '@getodk/common/types/dom.ts';
import { getItemElements, getItemsetElement } from '../../../lib/dom/query.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import type { BodyElementParentContext } from '../BodyDefinition.ts';
import { ControlDefinition } from './ControlDefinition.ts';
import { ItemDefinition } from './ItemDefinition.ts';
import { ItemsetDefinition } from './ItemsetDefinition.ts';

export type RankType = 'rank';

export interface RankElement extends LocalNamedElement<RankType> {}

const isRankElement = (element: Element): element is RankElement => {
	return element.localName === 'rank';
};

export class RankControlDefinition extends ControlDefinition<RankType> {
	static override isCompatible(localName: string, element: Element): boolean {
		return isRankElement(element);
	}

	readonly type: RankType = 'rank';
	readonly element: RankElement;
	readonly itemset: ItemsetDefinition | null;
	readonly items: readonly ItemDefinition[]; // ToDo: do we need this block?

	constructor(form: XFormDefinition, parent: BodyElementParentContext, element: Element) {
		if (!isRankElement(element)) {
			throw new Error(`Invalid rank element: <${element.nodeName}>`);
		}

		super(form, parent, element);

		this.type = element.localName as RankType;
		this.element = element;

		const itemsetElement = getItemsetElement(element);
		const itemElements = getItemElements(element);

		if (itemsetElement === null) { // ToDo: do we need this block?
			this.itemset = null;
			this.items = itemElements.map(itemElement => new ItemDefinition(form, this, itemElement));
		} else {
			if (itemElements.length > 0) {
				throw new Error(`<${element.nodeName}> has both <itemset> and <item> children`);
			}

			this.items = [];
			this.itemset = new ItemsetDefinition(form, this, itemsetElement);
		}
	}

	override toJSON() {
		return {};
	}
}
