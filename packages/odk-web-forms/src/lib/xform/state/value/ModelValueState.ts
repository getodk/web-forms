import { ValueState } from './ValueState.ts';

export class ModelValueState extends ValueState<'model'> {
	override readonly valueType = 'model';
	override readonly bodyElement = null;
}
