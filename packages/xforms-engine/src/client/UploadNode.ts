import type { UnknownAppearanceDefinition } from '../parse/body/appearance/unknownAppearanceParser.ts';
import type { UploadControlDefinition } from '../parse/body/control/UploadControlDefinition.ts';
import type { LeafNodeDefinition } from '../parse/model/LeafNodeDefinition.ts';
import type { BaseValueNode, BaseValueNodeState } from './BaseValueNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { RootNode } from './RootNode.ts';
import type { InstanceAttachmentFileName } from './serialization/InstanceData.ts';
import type { LeafNodeValidationState } from './validation.ts';
import type { ValueType } from './ValueType.ts';

export type UploadValue = File | null;

export interface UploadNodeState extends BaseValueNodeState<UploadValue> {
	get valueOptions(): null;
	get value(): UploadValue;
	get instanceValue(): InstanceAttachmentFileName;
}

export interface UploadDefinition<V extends ValueType = ValueType> extends LeafNodeDefinition<V> {
	readonly bodyElement: UploadControlDefinition;
}

export type AcceptedUploadExtension = `.${string}`;
export type AcceptedUploadMIMEType = `${string}/${string}`;

// prettier-ignore
export type AcceptedUploadType =
	| AcceptedUploadExtension
	| AcceptedUploadMIMEType;

// prettier-ignore
export type AcceptedUploadTypes =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| readonly [AcceptedUploadType, ...AcceptedUploadType[]]
	| readonly ['*/*'];

export interface UploadNodeOptions {
	readonly types: AcceptedUploadTypes;
}

export interface UploadNode extends BaseValueNode<'binary', UploadValue> {
	readonly nodeType: 'upload';
	/** @todo */
	readonly appearances: UnknownAppearanceDefinition;
	readonly nodeOptions: UploadNodeOptions;
	readonly valueType: 'binary';
	readonly definition: UploadDefinition<'binary'>;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;
	readonly currentState: UploadNodeState;
	readonly validationState: LeafNodeValidationState;

	setValue(value: UploadValue): RootNode;
}
