import { JAVAROSA_NAMESPACE_URI } from '@odk/common/constants/xmlns';
import { DependentExpression } from '../../expression/DependentExpression.ts';
import type { RepeatDefinition } from './RepeatDefinition.ts';

export class RepeatCountExpression extends DependentExpression<'number'> {
	static from(repeat: RepeatDefinition): RepeatCountExpression | null {
		const countExpression = repeat.element.getAttributeNS(JAVAROSA_NAMESPACE_URI, 'count');

		if (countExpression == null) {
			return null;
		}

		return new this(repeat, countExpression);
	}

	protected constructor(repeat: RepeatDefinition, countExpression: string) {
		super(repeat, 'number', countExpression);
	}
}
