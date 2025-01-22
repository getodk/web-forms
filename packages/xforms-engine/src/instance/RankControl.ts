import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type {
	RankDefinition,
	RankItem,
	RankNode,
	RankValueOptions,
} from '../client/RankNode.ts';
import type { TextRange } from '../client/TextRange.ts';
import type { XFormsXPathElement } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import { createSelectItems } from '../lib/reactivity/createSelectItems.ts';
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
import { RankFunctionalityError, RankValueTypeError } from '../error/RankValueTypeError.ts';
import { ItemCollectionCodec } from '../lib/codecs/ItemCollectionCodec.ts';
import { sharedValueCodecs } from '../lib/codecs/getSharedValueCodec.ts';
import type { AnyNodeDefinition } from '../parse/model/NodeDefinition.ts';

type AssertRangeNodeDefinition = (definition: RankDefinition) => asserts definition is RankDefinition<'string'>;
const assertRangeNodeDefinition: AssertRangeNodeDefinition = (definition) => {
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
	static from(parent: GeneralParentNode, definition: RankDefinition): RankControl {
		assertRangeNodeDefinition(definition);
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
	readonly currentState: CurrentState<RankControlStateSpec>;

	private constructor(parent: GeneralParentNode, definition: RankDefinition<'string'>) {
		const codec = new ItemCollectionCodec(sharedValueCodecs.string);

		super(parent, definition, codec);

		const valueOptions = createSelectItems(this); // ToDo extract to reuse function

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
				const optionsByValue = mapOptionsByValue();

				return baseGetValue().filter((value) => {
					return optionsByValue.has(value);
				});
			});
		});
		const valueState: SimpleAtomicState<readonly string[]> = [getValue, setValue];

		this.getInstanceValue = this.scope.runTask(() => {
			return createMemo(() => {
				return codec.encodeValue(getValue());
			});
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

				label: createNodeLabel(this, definition as AnyNodeDefinition),
				hint: createFieldHint(this, definition as AnyNodeDefinition),
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

	/**
	 * This method is a client-facing convenience API for reading state,
	 * so it **MUST** read from client-reactive state!
	 * @param value
	 */
	getValueOption(value: string): RankItem | null {
		const valueOption = this.currentState.valueOptions.find(item => item.value === value);
		return valueOption ?? null;
	}

	setValues(valuesInOrder: readonly string[]): Root {
		const sourceValues = this.mapOptionsByValue().keys();
		const hasAllValues = !sourceValues.some((sourceValue) => valuesInOrder.includes(sourceValue));
		if (hasAllValues) {
			throw new RankFunctionalityError('There are missing options. Rank should have all options');
		}

		this.setValueState(valuesInOrder);

		return this.root;
	}
}
