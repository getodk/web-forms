import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { SelectDefinition } from '../../../client/SelectNode.ts';
import { sharedValueCodecs } from '../getSharedValueCodec.ts';
import { BaseItemCollectionCodec } from '../BaseItemCollectionCodec.ts';
import { SingleValueSelectCodec } from './SingleValueSelectCodec.ts';

const multipleValueSelectCodec = new BaseItemCollectionCodec(sharedValueCodecs.string);

const singleValueSelectCodec = new SingleValueSelectCodec(sharedValueCodecs.string);

// prettier-ignore
export type SelectCodec =
	| BaseItemCollectionCodec
	| SingleValueSelectCodec;

export const getSelectCodec = (definition: SelectDefinition<'string'>): SelectCodec => {
	switch (definition.bodyElement.type) {
		case 'select':
			return multipleValueSelectCodec;

		case 'select1':
			return singleValueSelectCodec;

		default:
			throw new UnreachableError(definition.bodyElement.type);
	}
};
