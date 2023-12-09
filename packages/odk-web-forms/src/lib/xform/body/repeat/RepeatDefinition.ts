import { JAVAROSA_NAMESPACE_URI } from '@odk/common/constants/xmlns.ts';
import { staticBooleanExpressionResult } from '../../../xpath/analysis.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import type { BodyElementDefinitionArray } from '../BodyDefinition.ts';
import { BodyElementDefinition } from '../BodyElementDefinition.ts';
import type { RepeatGroupDefinition } from '../group/RepeatGroupDefinition.ts';
import { RepeatCountExpression } from './RepeatCountExpression.ts';

export class RepeatDefinition extends BodyElementDefinition<'repeat'> {
	override readonly category = 'structure';
	readonly type = 'repeat';
	override readonly reference: string;

	readonly countExpression: RepeatCountExpression | null;
	readonly isCountControlled: boolean;

	readonly children: BodyElementDefinitionArray;

	constructor(
		form: XFormDefinition,
		readonly groupDefinition: RepeatGroupDefinition,
		element: Element
	) {
		super(form, groupDefinition, element);

		const reference = element.getAttribute('nodeset');

		if (reference == null) {
			throw new Error('Invalid repeat: missing `nodeset` reference');
		}

		const countExpression = RepeatCountExpression.from(this);

		this.reference = reference;
		this.children = groupDefinition.getChildren(element);
		this.countExpression = countExpression;

		if (countExpression == null) {
			this.countExpression = null;

			const noAddRemoveExpession = element.getAttributeNS(JAVAROSA_NAMESPACE_URI, 'noAddRemove');

			this.isCountControlled =
				noAddRemoveExpession != null &&
				staticBooleanExpressionResult(noAddRemoveExpession) !== false;
		} else {
			this.countExpression = countExpression;
			this.isCountControlled = true;
		}
	}

	override toJSON() {
		const { form, groupDefinition, parent, ...rest } = this;

		return rest;
	}
}
