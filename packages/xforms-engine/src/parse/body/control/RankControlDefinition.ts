import type { LocalNamedElement } from '@getodk/common/types/dom.ts';
import { getItemsetElement } from '../../../lib/dom/query.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import type { BodyElementParentContext } from '../BodyDefinition.ts';
import { ControlDefinition } from './ControlDefinition.ts';
import { ItemsetDefinition } from './ItemsetDefinition.ts';

export type RankType = 'rank';
export interface RankElement extends LocalNamedElement<RankType> {}

export class RankControlDefinition extends ControlDefinition<RankType> {
	private static isRankElement(element: Element): element is RankElement {
		return element.localName === 'rank';
	}

	static override isCompatible(localName: string, element: Element): boolean {
		return RankControlDefinition.isRankElement(element);
	}

	readonly type: RankType = 'rank';
	readonly element: RankElement;
	readonly itemset: ItemsetDefinition;

	constructor(form: XFormDefinition, parent: BodyElementParentContext, element: Element) {
		if (!RankControlDefinition.isRankElement(element)) {
			throw new Error(`Invalid rank element: <${element.nodeName}>`);
		}

		super(form, parent, element);

		this.type = element.localName as RankType;
		this.element = element;
		this.itemset = new ItemsetDefinition(form, this, getItemsetElement(element));
	}

	override toJSON() {
		return {};
	}
}
