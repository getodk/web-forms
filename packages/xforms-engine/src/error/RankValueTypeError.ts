import { XFormsSpecViolationError } from './XFormsSpecViolationError.ts';
import type { RankDefinition } from '../client/RankNode.ts';
import type { UnsupportedRankValueType } from '../lib/codecs/select/BaseSelectCodec.ts';
import { XPathFunctionalityError, type XPathFunctionalityErrorCategory } from './XPathFunctionalityError.ts';

export class RankValueTypeError extends XFormsSpecViolationError {
	constructor(definition: RankDefinition<UnsupportedRankValueType>) {
		// ToDo fix typing
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { valueType } = definition;

		super(
			`Ranks of type ${valueType} are not currently supported. If this functionality would be useful for your form, your feedback is welcome!`
		);
	}
}

export class RankFunctionalityError extends XPathFunctionalityError {
	constructor(functionalityMessagePrefix: string, category: XPathFunctionalityErrorCategory) {
		super(functionalityMessagePrefix, category);
	}
}
