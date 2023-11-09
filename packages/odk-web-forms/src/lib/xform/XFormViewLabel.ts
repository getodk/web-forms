import type { XFormEntryBinding } from './XFormEntryBinding.ts';
import type { XFormViewChild } from './XFormViewChild.ts';

interface BaseXFormViewLabelPart {
	readonly type: 'dynamic' | 'static';
	readonly expression: string | null;
	readonly textContent: string | null;

	evaluate(binding: XFormEntryBinding): string;
}

// Supports `<label ref="expr">`, also anticipating `<output>`
class XFormViewLabelDynamicPart implements BaseXFormViewLabelPart {
	readonly type = 'dynamic';
	readonly textContent: null = null;

	constructor(readonly expression: string) {}

	evaluate(binding: XFormEntryBinding): string {
		return binding.evaluateTranslatedExpression(this.expression);
	}
}

class XFormViewLabelStaticPart implements BaseXFormViewLabelPart {
	readonly type = 'static';
	readonly expression: null = null;

	constructor(readonly textContent: string) {}

	evaluate(): string {
		return this.textContent;
	}
}

type XFormViewLabelPart = XFormViewLabelDynamicPart | XFormViewLabelStaticPart;

export class XFormViewLabel {
	static fromViewChild(child: XFormViewChild, childElement: Element): XFormViewLabel | null {
		const labelElement = childElement.querySelector(':scope > label');

		if (labelElement == null) {
			return null;
		}

		return new this(child, labelElement);
	}

	readonly parts: readonly XFormViewLabelPart[];

	// TODO: if `labelText` does stay above, the `XFormViewChild` will be a likely
	// way to establish context for evaluating expressions defined by `<label
	// ref>` and `<output value>`
	protected constructor(_child: XFormViewChild, labelElement: Element) {
		// TODO: `nodeset` supported?
		const ref = labelElement.getAttribute('ref');

		if (ref != null) {
			this.parts = [new XFormViewLabelDynamicPart(ref)];
		} else {
			this.parts = Array.from(labelElement.childNodes).map((childNode) => {
				const { nodeType } = childNode;

				if (nodeType === Node.ELEMENT_NODE && (childNode as Element).localName === 'output') {
					throw new Error('todo');
				}

				const { textContent } = childNode;

				if (textContent == null) {
					throw new Error(`Invalid label child node (missing textContent), of type ${nodeType}`);
				}

				return new XFormViewLabelStaticPart(childNode.textContent ?? '');
			});
		}
	}
}
