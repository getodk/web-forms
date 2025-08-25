import { StaticElement } from '../../../integration/xpath/static-dom/StaticElement.ts';
import type { ItemsetElement } from '../../../lib/dom/query.ts';
import { getValueElement } from '../../../lib/dom/query.ts';
import { ItemsetGeometryExpression } from '../../expression/ItemsetGeometryExpression.ts';
import { ItemsetMetadataExpression } from '../../expression/ItemsetMetadataExpression.ts';
import { ItemsetNodesetExpression } from '../../expression/ItemsetNodesetExpression.ts';
import { ItemsetValueExpression } from '../../expression/ItemsetValueExpression.ts';
import { ItemsetLabelDefinition } from '../../text/ItemsetLabelDefinition.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import { parseNodesetReference } from '../../xpath/reference-parsing.ts';
import { BodyElementDefinition } from '../BodyElementDefinition.ts';
import type { AnySelectControlDefinition } from './SelectControlDefinition.ts';
import { RankControlDefinition } from './RankControlDefinition.ts';

export class ItemsetDefinition extends BodyElementDefinition<'itemset'> {
	override readonly category = 'support';
	readonly type = 'itemset';

	override readonly reference: string;
	override readonly label: ItemsetLabelDefinition | null;

	readonly nodes: ItemsetNodesetExpression;
	readonly value: ItemsetValueExpression;
	readonly geometry: ItemsetGeometryExpression;
	readonly metadataExclusions: string[];

	constructor(
		form: XFormDefinition,
		override readonly parent: AnySelectControlDefinition | RankControlDefinition,
		element: ItemsetElement
	) {
		super(form, parent, element);

		const nodesetExpression = parseNodesetReference(parent, element, 'nodeset');

		this.nodes = new ItemsetNodesetExpression(this, nodesetExpression);
		this.reference = nodesetExpression;

		const valueElement = getValueElement(element);

		if (valueElement == null) {
			throw new Error('<itemset> has no <value>');
		}

		const valueExpression = parseNodesetReference(
			{
				reference: null,
			},
			valueElement,
			'ref'
		);

		if (valueExpression == null) {
			throw new Error(`<itemset> has no <value>`);
		}

		this.label = ItemsetLabelDefinition.from(form, this);
		this.value = new ItemsetValueExpression(this, valueExpression);
		this.geometry = new ItemsetGeometryExpression(this);

		this.metadataExclusions = ['itextId', this.value.expression, this.geometry.expression];
	}

	getMetadataExpressions(metadataNodes: StaticElement[]): ItemsetMetadataExpression[] {
		return metadataNodes
			.filter((node) => {
				const { localName } = node.qualifiedName;
				return localName.length && !this.metadataExclusions.includes(localName);
			})
			.map((node) => new ItemsetMetadataExpression(this, node.qualifiedName.localName));
	}
}
