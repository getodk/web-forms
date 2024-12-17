import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { identity } from '@getodk/common/lib/identity.ts';
import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import type { NoteNode, NoteNodeAppearances } from '../client/NoteNode.ts';
import type { SubmissionState } from '../client/submission/SubmissionState.ts';
import type { TextRange } from '../client/TextRange.ts';
import type { AnyViolation, LeafNodeValidationState } from '../client/validation.ts';
import type { XFormsXPathElement } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import { createLeafNodeSubmissionState } from '../lib/client-reactivity/submission/createLeafNodeSubmissionState.ts';
import { createNoteReadonlyThunk } from '../lib/reactivity/createNoteReadonlyThunk.ts';
import { createValueState } from '../lib/reactivity/createValueState.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createFieldHint } from '../lib/reactivity/text/createFieldHint.ts';
import { createNodeLabel } from '../lib/reactivity/text/createNodeLabel.ts';
import { createNoteText, type ComputedNoteText } from '../lib/reactivity/text/createNoteText.ts';
import type { SimpleAtomicState } from '../lib/reactivity/types.ts';
import type { SharedValidationState } from '../lib/reactivity/validation/createValidation.ts';
import { createValidationState } from '../lib/reactivity/validation/createValidation.ts';
import type { NoteNodeDefinition } from '../parse/model/NoteNodeDefinition.ts';
import type { DescendantNodeStateSpec } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { ClientReactiveSubmittableLeafNode } from './internal-api/submission/ClientReactiveSubmittableLeafNode.ts';
import type { ValidationContext } from './internal-api/ValidationContext.ts';
import type { ValueContext } from './internal-api/ValueContext.ts';

interface NoteStateSpec extends DescendantNodeStateSpec<string> {
	readonly readonly: Accessor<true>;
	readonly noteText: ComputedNoteText;
	readonly label: Accessor<TextRange<'label', 'form'> | null>;
	readonly hint: Accessor<TextRange<'hint', 'form'> | null>;
	readonly children: null;
	readonly value: SimpleAtomicState<string>;
	readonly valueOptions: null;
}

export class Note
	extends DescendantNode<NoteNodeDefinition, NoteStateSpec, GeneralParentNode, null>
	implements
		NoteNode,
		XFormsXPathElement,
		EvaluationContext,
		ValidationContext,
		ValueContext<string>,
		ClientReactiveSubmittableLeafNode<string>
{
	private readonly validation: SharedValidationState;

	// XFormsXPathElement
	override readonly [XPathNodeKindKey] = 'element';

	// InstanceNode
	protected readonly state: SharedNodeState<NoteStateSpec>;
	protected readonly engineState: EngineState<NoteStateSpec>;

	// NoteNode
	readonly nodeType = 'note';
	readonly appearances: NoteNodeAppearances;
	readonly currentState: CurrentState<NoteStateSpec>;

	get validationState(): LeafNodeValidationState {
		return this.validation.currentState;
	}

	readonly submissionState: SubmissionState;

	// ValueContext
	override readonly contextNode = this;
	readonly encodeValue = identity<string>;
	readonly decodeValue = identity<string>;

	constructor(parent: GeneralParentNode, definition: NoteNodeDefinition) {
		super(parent, definition);

		this.appearances = definition.bodyElement.appearances;

		const sharedStateOptions = {
			clientStateFactory: this.engineConfig.stateFactory,
		};

		const isReadonly = createNoteReadonlyThunk(this, definition);
		const noteTextComputation = createNoteText(this, definition.noteTextDefinition);

		let noteText: ComputedNoteText;
		let label: Accessor<TextRange<'label', 'form'> | null>;
		let hint: Accessor<TextRange<'hint', 'form'> | null>;

		switch (noteTextComputation.role) {
			case 'label': {
				noteText = noteTextComputation.label;
				label = noteTextComputation.label;
				hint = createFieldHint(this, definition);

				break;
			}

			case 'hint': {
				noteText = noteTextComputation.hint;
				label = createNodeLabel(this, definition);
				hint = noteTextComputation.hint;

				break;
			}

			default:
				throw new UnreachableError(noteTextComputation);
		}

		const state = createSharedNodeState(
			this.scope,
			{
				reference: this.contextReference,
				readonly: isReadonly,
				relevant: this.isRelevant,
				required: this.isRequired,

				label,
				hint,
				noteText,

				children: null,
				valueOptions: null,
				value: createValueState(this),
			},
			sharedStateOptions
		);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = state.currentState;
		this.validation = createValidationState(this, sharedStateOptions);
		this.submissionState = createLeafNodeSubmissionState(this);
	}

	// XFormsXPathElement
	override getXPathValue(): string {
		return this.engineState.value;
	}

	// ValidationContext
	getViolation(): AnyViolation | null {
		return this.validation.engineState.violation;
	}

	isBlank(): boolean {
		return this.engineState.value === '';
	}

	// InstanceNode
	getChildren(): readonly [] {
		return [];
	}
}
