import { FunctionImplementation } from '../../evaluator/functions/FunctionImplementation.ts';

export const choiceName = new FunctionImplementation(
	[],
	() => {
		throw new Error('Not implemented');
	},
	{ localName: 'choice-name' }
);
