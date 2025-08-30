import type { ItemsetDefinition } from '../body/control/ItemsetDefinition.ts';
import { DependentExpression } from './abstract/DependentExpression.ts';

export class ItemsetMetadataExpression extends DependentExpression<'string'> {
	readonly elementName: string;

	constructor(
		readonly itemset: ItemsetDefinition,
		elementName: string
	) {
		super(itemset, 'string', elementName);
		this.elementName = elementName;
	}
}
