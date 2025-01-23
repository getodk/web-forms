import { UpsertableMap } from '@getodk/common/lib/collections/UpsertableMap.ts';
import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type { ActiveLanguage } from '../../client/FormLanguage.ts';
import type { TextRange as ClientTextRange } from '../../client/TextRange.ts';
import type { EvaluationContext } from '../../instance/internal-api/EvaluationContext.ts';
import type { EngineXPathNode } from '../../integration/xpath/adapter/kind.ts';
import type { EngineXPathEvaluator } from '../../integration/xpath/EngineXPathEvaluator.ts';
import type { ItemsetDefinition } from '../../parse/body/control/ItemsetDefinition.ts';
import { createComputedExpression } from './createComputedExpression.ts';
import type { ReactiveScope } from './scope.ts';
import { createTextRange } from './text/createTextRange.ts';
import type { RankControl } from '../../instance/RankControl.ts';
import type { SelectControl } from '../../instance/SelectControl.ts';
import type { TranslationContext } from '../../instance/internal-api/TranslationContext.ts';
import { TextChunk } from '../../instance/text/TextChunk.ts';
import { TextRange } from '../../instance/text/TextRange.ts';

type ItemsetControl = SelectControl | RankControl;

class ItemsetItemEvaluationContext implements EvaluationContext {
	readonly isAttached: Accessor<boolean>;
	readonly scope: ReactiveScope;
	readonly evaluator: EngineXPathEvaluator;
	readonly contextReference: Accessor<string>;
	readonly getActiveLanguage: Accessor<ActiveLanguage>;

	constructor(control: ItemsetControl, readonly contextNode: EngineXPathNode) {
		this.isAttached = control.isAttached;
		this.scope = control.scope;
		this.evaluator = control.evaluator;
		this.contextReference = control.contextReference;
		this.getActiveLanguage = control.getActiveLanguage;
	}
}

type DerivedItemLabel = ClientTextRange<'item-label', 'form-derived'>;

export const derivedItemLabel = (context: TranslationContext, value: string): DerivedItemLabel => {
	const chunk = new TextChunk(context, 'literal', value);

	return new TextRange('form-derived', 'item-label', [chunk]);
};

const createItemsetItemLabel = (
	context: EvaluationContext,
	definition: ItemsetDefinition,
	itemValue: Accessor<string>
): Accessor<ClientTextRange<'item-label'>> => {
	const { label } = definition;

	if (label == null) {
		return createMemo(() => derivedItemLabel(context, itemValue()));
	}

	return createTextRange(context, 'item-label', label);
};

interface ItemsetItem {
	label(): ClientTextRange<'item-label'>;
	value(): string;
}

const createItemsetItems = (control: ItemsetControl, itemset: ItemsetDefinition): Accessor<readonly ItemsetItem[]> => {
	return control.scope.runTask(() => {
		const itemNodes = createComputedExpression(control, itemset.nodes, { defaultValue: [] });
		const itemsCache = new UpsertableMap<EngineXPathNode, ItemsetItem>();

		return createMemo(() => {
			return itemNodes().map((itemNode) => {
				return itemsCache.upsert(itemNode, () => {
					const context = new ItemsetItemEvaluationContext(control, itemNode);
					const value = createComputedExpression(context, itemset.value, { defaultValue: '' });
					const label = createItemsetItemLabel(context, itemset, value);

					return { label, value };
				});
			});
		});
	});
};

export interface SourceValueItem {
	readonly value: string;
	readonly label: ClientTextRange<'item-label'>;
}

export const createItemset = (
	control: ItemsetControl,
	itemset: ItemsetDefinition,
): Accessor<readonly SourceValueItem[]> => {
	return control.scope.runTask(() => {
		const itemsetItems = createItemsetItems(control, itemset);

		return createMemo(() => {
			return itemsetItems().map((item) => {
				return {
					label: item.label(),
					value: item.value(),
				};
			});
		});
	});
};
