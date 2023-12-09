import type { AnyTextElementDefinition } from './TextElementDefinition.ts';

export class TextElementStaticPart {
	readonly type = 'static';
	readonly stringValue: string;

	constructor(
		readonly context: AnyTextElementDefinition,
		node: Text
	) {
		this.stringValue = node.data;
	}

	toJSON() {
		const { stringValue } = this;

		return { stringValue };
	}
}
