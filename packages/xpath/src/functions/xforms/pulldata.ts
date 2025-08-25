import { StringFunction } from '../../evaluator/functions/StringFunction.ts';

export const pulldata = new StringFunction(
	'pulldata',
	[{ arityType: 'required' }, { arityType: 'required' }, { arityType: 'required' }, { arityType: 'required' }],
	(context, [ instanceEvaluation, desiredElementEvaluation, queryElementEvaluation, queryEvaluation ]): string => {

		const instanceId = instanceEvaluation!.evaluate(context).toString();
		const desiredElement = desiredElementEvaluation!.evaluate(context).toString();
		const queryElement = queryElementEvaluation!.evaluate(context).toString();
		const query = queryEvaluation!.evaluate(context).toString();

		const value = context.evaluator.evaluateString(`instance('${instanceId}')/root/item[${queryElement}=${query}]/${desiredElement}`);
		return value;
	}
);
