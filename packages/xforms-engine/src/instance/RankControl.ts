import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type { RankDefinition, RankItem, RankNode, RankValueOptions } from '../client/RankNode.ts';
import type { TextRange } from '../client/TextRange.ts';
import type { XFormsXPathElement } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createFieldHint } from '../lib/reactivity/text/createFieldHint.ts';
import { createNodeLabel } from '../lib/reactivity/text/createNodeLabel.ts';
import type { SimpleAtomicState } from '../lib/reactivity/types.ts';
import type { Root } from './Root.ts';
import type { ValueNodeStateSpec } from './abstract/ValueNode.ts';
import { ValueNode } from './abstract/ValueNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { ValidationContext } from './internal-api/ValidationContext.ts';
import type { ClientReactiveSubmittableValueNode } from './internal-api/submission/ClientReactiveSubmittableValueNode.ts';
import { MultipleValueItemCodec } from '../lib/codecs/items/MultipleValueItemCodec.ts';
import { sharedValueCodecs } from '../lib/codecs/getSharedValueCodec.ts';
import { createItemCollection } from '../lib/reactivity/createItemCollection.ts';
import type { UnknownAppearanceDefinition } from '../parse/body/appearance/unknownAppearanceParser.ts';
import type { ValueType } from '../client/ValueType.ts';
import { RankMissingValueError } from '../error/RankMissingValueError.ts';
import { RankValueTypeError } from '../error/RankValueTypeError.ts';

export type AnyRankDefinition = {
	[V in ValueType]: RankDefinition<V>;
}[ValueType];

type AssertRankNodeDefinition = (
	definition: AnyRankDefinition
) => asserts definition is RankDefinition<'string'>;

const assertRankNodeDefinition: AssertRankNodeDefinition = (definition) => {
	if (definition.valueType !== 'string') {
		throw new RankValueTypeError(definition);
	}
};

type RankItemMap = ReadonlyMap<string, RankItem>;

interface RankControlStateSpec extends ValueNodeStateSpec<readonly string[]> {
	readonly label: Accessor<TextRange<'label'> | null>;
	readonly hint: Accessor<TextRange<'hint'> | null>;
	readonly valueOptions: Accessor<RankValueOptions>;
}

export class RankControl
	extends ValueNode<'string', RankDefinition<'string'>, readonly string[], readonly string[]>
	implements
		RankNode,
		XFormsXPathElement,
		EvaluationContext,
		ValidationContext,
		ClientReactiveSubmittableValueNode
{
	static from(parent: GeneralParentNode, definition: RankDefinition): RankControl;
	static from(parent: GeneralParentNode, definition: AnyRankDefinition): RankControl {
		assertRankNodeDefinition(definition);
		return new this(parent, definition);
	}

	private readonly mapOptionsByValue: Accessor<RankItemMap>;

	protected override readonly getInstanceValue: Accessor<string>;

	// XFormsXPathElement
	override readonly [XPathNodeKindKey] = 'element';

	// InstanceNode
	protected readonly state: SharedNodeState<RankControlStateSpec>;
	protected readonly engineState: EngineState<RankControlStateSpec>;

	// RankNode
	readonly nodeType = 'rank';
	readonly appearances: UnknownAppearanceDefinition;
	readonly currentState: CurrentState<RankControlStateSpec>;

	private constructor(parent: GeneralParentNode, definition: RankDefinition<'string'>) {
		const codec = new MultipleValueItemCodec(sharedValueCodecs.string);
		super(parent, definition, codec);

		this.appearances = definition.bodyElement.appearances;

		const valueOptions = createItemCollection(this);
		const mapOptionsByValue: Accessor<RankItemMap> = this.scope.runTask(() => {
			return createMemo(() => {
				return new Map(valueOptions().map((item) => [item.value, item]));
			});
		});

		this.mapOptionsByValue = mapOptionsByValue;

		const baseValueState = this.valueState;
		const [baseGetValue, setValue] = baseValueState;
		const getValue = this.scope.runTask(() => {
			return createMemo(() => {
				return this.getOrderedValues(valueOptions(), baseGetValue());
			});
		});
		const valueState: SimpleAtomicState<readonly string[]> = [getValue, setValue];

		this.getInstanceValue = this.scope.runTask(() => {
			return createMemo(() => codec.encodeValue(getValue()));
		});

		const sharedStateOptions = {
			clientStateFactory: this.engineConfig.stateFactory,
		};

		const state = createSharedNodeState(
			this.scope,
			{
				reference: this.contextReference,
				readonly: this.isReadonly,
				relevant: this.isRelevant,
				required: this.isRequired,
				label: createNodeLabel(this, definition),
				hint: createFieldHint(this, definition),
				children: null,
				valueOptions,
				value: valueState,
				instanceValue: this.getInstanceValue,
			},
			sharedStateOptions
		);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = state.currentState;
	}

	getValueLabel(value: string): TextRange<'item-label'> | null {
		const valueOption = this.currentState.valueOptions.find((item) => item.value === value);
		return valueOption?.label ?? null;
	}

	setValues(valuesInOrder: readonly string[]): Root {
		const sourceValues: string[] = Array.from(this.mapOptionsByValue().keys());
		const hasAllValues = sourceValues.some((sourceValue) => valuesInOrder.includes(sourceValue));
		if (!hasAllValues) {
			throw new RankMissingValueError('There are missing options. Rank should have all options.');
		}

		this.setValueState(valuesInOrder);
		return this.root;
	}

	getOrderedValues(valueOptions: RankValueOptions, values: readonly string[]): readonly string[] {
		if (!values?.length) {
			return [];
		}

		const currentOrder = new Map(values.map((option, index) => [option, index]));
		const exitingOptions: string[] = [];
		const newOptionsForRank: string[] = [];

		valueOptions.forEach((item: RankItem) => {
			const index = currentOrder.get(item.value);

			if (index !== undefined) {
				exitingOptions[index] = item.value;
				return;
			}

			newOptionsForRank.push(item.value);
		});

		return [...exitingOptions.filter(Boolean), ...newOptionsForRank];
	}
}
