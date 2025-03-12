const TEMPLATED_NODE_SERIALIZATION_ERROR_MESSAGES = {
	TEMPLATE_ATTRIBUTE_OMISSION_NOT_IMPLEMENTED: 'Template attribute omission not implemented',
} as const;

type TemplatedNodeSerializationErrorMessages = typeof TEMPLATED_NODE_SERIALIZATION_ERROR_MESSAGES;

type TemplatedNodeSerializationErrorMessage =
	TemplatedNodeSerializationErrorMessages[keyof TemplatedNodeSerializationErrorMessages];

export class TemplatedNodeSerializationError extends Error {
	static readonly MESSAGES = TEMPLATED_NODE_SERIALIZATION_ERROR_MESSAGES;

	constructor(message: TemplatedNodeSerializationErrorMessage) {
		super(message);
	}
}
