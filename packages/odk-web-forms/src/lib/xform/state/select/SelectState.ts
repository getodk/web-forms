import { xmlXPathWhitespaceSeparatedList } from '@odk/common/lib/string/whitespace.ts';
import { ReactiveSet } from '@solid-primitives/set';
import { batch, createComputed, createMemo, type Accessor } from 'solid-js';
import { createUninitializedAccessor } from '../../../reactivity/primitives/uninitialized.ts';
import type { AnySelectDefinition } from '../../body/control/select/SelectDefinition.ts';
import type { SelectValueNodeDefinition } from '../../model/value-node/SelectValueNodeDefinition.ts';
import type { EntryState } from '../EntryState.ts';
import type { AnyParentState } from '../NodeState.ts';
import { ValueState } from '../value/ValueState.ts';
import { SelectStateItem } from './SelectStateItem.ts';

export class SelectState extends ValueState<'select'> {
	override readonly valueType = 'select';
	override readonly bodyElement: AnySelectDefinition;

	protected readonly isMultiple: boolean;

	protected _items: Accessor<readonly SelectStateItem[]>;

	get items(): Accessor<readonly SelectStateItem[]> {
		return this._items;
	}

	/**
	 * Stores all currently selected item values, as selected either by:
	 *
	 * - initial submission state (i.e. new entry with default values, presumably
	 *   editing a previous or incomplete submission)
	 * - user intervention (e.g. the user directly selects values in the view)
	 *
	 * This is in-memory state, which may (intentionally) diverge from the values
	 * available in {@link items}. The actual stored submission state is
	 * serialized from the intersection of values in this set, and values
	 * available in `items`. The intent/effect is to support the following example
	 * scenario:
	 *
	 * 1. Initially the items available are: A, B, C.
	 *
	 * 2. The user selects items A, B. Effective states:
	 *
	 *    - `items`:    A, B, C
	 *    - `selected`: A, B
	 *    - submission: A, B
	 *
	 * 3. The user performs an action causing the items to be filtered to: A, C.
	 *    Effective states:
	 *
	 *    - `items`:    A, C
	 *    - `selected`: A, B
	 *    - submission: A
	 *
	 * 4. The user performs an action reverting the previous filter, restoring the
	 *    item values to: A, B, C. Effective states:
	 *
	 *    - `items`:    A, B, C
	 *    - `selected`: A, B
	 *    - submission: A, B
	 *
	 * It's assumed that the above behavior is **at least** user-friendly, and
	 * quite likely expected.
	 *
	 * It is also assumed, but not yet implemented, that any user initiated
	 * selection change should discard `selected` values which have been
	 * subsequently filterered from `items`, i.e. in lieu of the above step 4:
	 *
	 * 4. The user adds C to the selection. Effective states:
	 *
	 *    - `items`: A, C
	 *    - `selected`: A, C  -- **not** A, B, C
	 *    - submission: A, C
	 *
	 * 5. The user performs an action reverting the previous filter, restoring
	 *    item values: A, B, C. Effective states:
	 *
	 *    - `items`: A, B, C
	 *    - `selected`: A, C  -- **not** A, B, C
	 *    - submission: A, C
	 */
	protected selected: ReactiveSet<string>;

	constructor(
		entry: EntryState,
		parent: AnyParentState,
		override readonly definition: SelectValueNodeDefinition
	) {
		super(entry, parent, definition);

		const { bodyElement } = definition;

		this.bodyElement = bodyElement;
		this.isMultiple = bodyElement.type === 'select';

		this._items = createUninitializedAccessor<readonly SelectStateItem[]>();
		this.selected = new ReactiveSet();
	}

	override initializeState(): void {
		super.initializeState();

		const { definition } = this;
		const { bodyElement } = definition;
		const items = this.createItems(bodyElement);
		const initialValue = xmlXPathWhitespaceSeparatedList(definition.defaultValue, {
			ignoreEmpty: true,
		});
		const selected = new ReactiveSet<string>(initialValue);

		this._items = items;
		this.selected = selected;

		const itemValues = createMemo(() => items().map((item) => item.value));
		const serializedValue = createMemo(() => {
			return itemValues()
				.filter((itemValue) => selected.has(itemValue))
				.join(' ');
		});

		createComputed(() => {
			this.setValue(serializedValue());
		});
	}

	protected createItems(select: AnySelectDefinition): Accessor<readonly SelectStateItem[]> {
		const { itemset } = select;

		if (itemset == null) {
			const stateItems = select.items.map((item) => {
				return new SelectStateItem(this, item.value, item.label);
			});

			return () => stateItems;
		} else {
			const itemNodes = this.createNodesetEvaluation(itemset.nodes);

			return createMemo(() => {
				return itemNodes().map((contextNode) => {
					const itemOptions = { contextNode };
					const value = this.entry.evaluator.evaluateString(itemset.value.expression, itemOptions);
					const { label } = itemset;

					return new SelectStateItem(this, value, label, itemOptions);
				});
			});
		}
	}

	isSelected(item: SelectStateItem): boolean {
		return this.selected.has(item.value);
	}

	deselect(item: SelectStateItem): void {
		this.selected.delete(item.value);
	}

	select(item: SelectStateItem): void {
		this.selected.add(item.value);
	}

	selectExclusive(value: string): void {
		batch(() => {
			this.selected.clear();
			this.selected.add(value);
		});
	}
}
