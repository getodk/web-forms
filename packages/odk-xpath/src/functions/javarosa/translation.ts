import { StringFunction } from '../../evaluator/functions/StringFunction.ts';

export const itext = new StringFunction(
	[{ arityType: 'required', typeHint: 'string' }],
	(context, [idExpression]) => {
		const { xformsContext } = context;

		if (xformsContext == null) {
			throw new Error('itext not available: not an XForm');
		}

		const id = idExpression!.evaluate(context).toString();

		return xformsContext.translations.itext(context, id);
	},
	{ localName: 'itext' }
);
