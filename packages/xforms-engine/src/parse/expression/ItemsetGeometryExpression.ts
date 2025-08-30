import type { ItemsetDefinition } from '../body/control/ItemsetDefinition.ts';
import { DependentExpression } from './abstract/DependentExpression.ts';

export class ItemsetGeometryExpression extends DependentExpression<'string'> {
	constructor(readonly itemset: ItemsetDefinition) {
		super(itemset, 'string', 'geometry');
	}
}
