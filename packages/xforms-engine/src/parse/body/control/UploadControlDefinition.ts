import type {
	AcceptedUploadExtension,
	AcceptedUploadMIMEType,
	AcceptedUploadType,
	AcceptedUploadTypes,
	UploadNodeOptions,
} from '../../../client/UploadNode.ts';
import { ErrorProductionDesignPendingError } from '../../../error/ErrorProductionDesignPendingError.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import {
	unknownAppearanceParser,
	type UnknownAppearanceDefinition,
} from '../appearance/unknownAppearanceParser.ts';
import type { BodyElementParentContext } from '../BodyDefinition.ts';
import { ControlDefinition } from './ControlDefinition.ts';

const isAcceptedUploadExtension = (value: string): value is AcceptedUploadExtension => {
	return value.startsWith('.');
};

const isAcceptedUploadMIMEType = (value: string): value is AcceptedUploadMIMEType => {
	return value.includes('/');
};

type AssertAcceptedUploadMIMEType = (value: string) => asserts value is AcceptedUploadMIMEType;

const assertAcceptedUploadMIMEType: AssertAcceptedUploadMIMEType = (value) => {
	if (!isAcceptedUploadMIMEType(value)) {
		throw new ErrorProductionDesignPendingError(`Expected a MIME type string, got: ${value}`);
	}
};

type AssertAcceptedUploadType = (value: string) => asserts value is AcceptedUploadType;

const assertAcceptedUploadType: AssertAcceptedUploadType = (value) => {
	if (!isAcceptedUploadExtension(value) && !isAcceptedUploadMIMEType(value)) {
		throw new ErrorProductionDesignPendingError(
			`Expected a file extension or MIME type string, got: ${value}`
		);
	}
};

type AssertAcceptedUploadTypes = (
	values: readonly string[]
) => asserts values is AcceptedUploadTypes;

const assertAcceptedUploadTypes: AssertAcceptedUploadTypes = (values) => {
	if (values.length === 0) {
		throw new ErrorProductionDesignPendingError('Expected at least one accepted upload type');
	}

	values.forEach(assertAcceptedUploadType);
};

const parseAcceptedUploadTypes = (element: Element): AcceptedUploadTypes => {
	const accept = element.getAttribute('accept');

	if (accept == null) {
		const mediaType = element.getAttribute('mediatype');

		if (mediaType == null) {
			return ['*/*'];
		}

		assertAcceptedUploadMIMEType(mediaType);

		return [mediaType];
	}

	const results = accept.split(/\s*,\s*/);

	assertAcceptedUploadTypes(results);

	return results;
};

const parseUploadNodeOptions = (element: Element): UploadNodeOptions => {
	const types = parseAcceptedUploadTypes(element);

	return { types };
};

export class UploadControlDefinition extends ControlDefinition<'upload'> {
	static override isCompatible(localName: string): boolean {
		return localName === 'upload';
	}

	readonly type = 'upload';
	readonly appearances: UnknownAppearanceDefinition;
	readonly options: UploadNodeOptions;

	constructor(form: XFormDefinition, parent: BodyElementParentContext, element: Element) {
		super(form, parent, element);

		this.appearances = unknownAppearanceParser.parseFrom(element, 'appearance');
		this.options = parseUploadNodeOptions(element);
	}

	override toJSON(): object {
		return {};
	}
}
