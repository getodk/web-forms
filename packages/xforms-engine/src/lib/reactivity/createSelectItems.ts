import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type { SelectItem } from '../../client/SelectNode.ts';
import type { TextRange as ClientTextRange } from '../../client/TextRange.ts';
import type { EvaluationContext } from '../../instance/internal-api/EvaluationContext.ts';
import type { SelectControl } from '../../instance/SelectControl.ts';
import type { ItemDefinition } from '../../parse/body/control/ItemDefinition.ts';
import { createTextRange } from './text/createTextRange.ts';
import type { SourceValueItem, createItemset, derivedItemLabel } from './createBaseItemset.ts';

const createSelectItemLabel = (
	context: EvaluationContext,
	definition: ItemDefinition
): Accessor<ClientTextRange<'item-label'>> => {
	const { label, value } = definition;

	if (label == null) {
		return () => derivedItemLabel(context, value);
	}

	return createTextRange(context, 'item-label', label);
};

interface SourceValueSelectItem extends SourceValueItem { }

const createTranslatedStaticSelectItems = (
	select: SelectControl,
	items: readonly ItemDefinition[]
): Accessor<readonly SourceValueSelectItem[]> => {
	return select.scope.runTask(() => {
		const labeledItems = items.map((item) => {
			const { value } = item;
			const label = createSelectItemLabel(select, item);

			return () => ({
				value,
				label: label(),
			});
		});

		return createMemo(() => {
			return labeledItems.map((item) => item());
		});
	});
};

/**
 * Creates a reactive computation of a {@link SelectControl}'s
 * {@link SelectItem}s, in support of the field's `valueOptions`.
 *
 * - Selects defined with static `<item>`s will compute to an corresponding
 *   static list of items.
 * - Selects defined with a computed `<itemset>` will compute to a reactive list
 *   of items.
 * - Items of both will produce {@link SelectItem.label | labels} reactive to
 *   their appropriate dependencies (whether relative to the itemset item node,
 *   referencing a form's `itext` translations, etc).
 */
export const createSelectItems = (select: SelectControl): Accessor<readonly SelectItem[]> => {
	const { items, itemset } = select.definition.bodyElement;

	if (itemset != null) {
		return createItemset(select, itemset);
	}

	return createTranslatedStaticSelectItems(select, items);
};
