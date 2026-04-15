import { getBlobData } from '@getodk/common/lib/web-compat/blob.ts';
import { INSTANCE_FILE_NAME } from '../../client/constants.ts';
import type { ResolvableInstanceAttachmentsMap } from '../../client/form/EditFormInstance.ts';
import { MalformedInstanceDataError } from '../../error/MalformedInstanceDataError.ts';
import { getResponseContentType } from '../../lib/resource-helpers.ts';
import type { FetchResourceResponse } from '../resource.ts';

type InstanceAttachmentMapSourceEntry = readonly [key: string, value: File | Promise<File>];

interface InstanceAttachmentMapSource {
	entries(): Iterable<InstanceAttachmentMapSourceEntry>;
}

const DEFAULT_ATTACHMENT_TYPE = 'application/octet-stream';

const resolveContentType = (response: FetchResourceResponse, blob: Blob): string => {
	let result = blob.type;

	if (result === '') {
		result = getResponseContentType(response) ?? result;
	}

	if (result === '') {
		return DEFAULT_ATTACHMENT_TYPE;
	}

	return result;
};

const resolveInstanceAttachmentFile = async (
	response: FetchResourceResponse,
	fileName: string
): Promise<File> => {
	const blob = await response.blob();
	const blobData = await getBlobData(blob);

	return new File([blobData], fileName, {
		type: resolveContentType(response, blob),
	});
};

const resolveInstanceAttachmentMapSource = (
	input: ResolvableInstanceAttachmentsMap
): InstanceAttachmentMapSource => {
	const entries = Array.from(input.entries()).map(([fileName, resolveAttachment]) => {
		const value = resolveAttachment().then((response) =>
			resolveInstanceAttachmentFile(response, fileName)
		);
		return [fileName, value] as const;
	});

	return { entries: () => entries };
};

export class InstanceAttachmentMap extends Map<string, File | Promise<File>> {
	static from(sources: readonly InstanceAttachmentMapSource[]): InstanceAttachmentMap {
		return new this(sources);
	}

	static resolve(input: ResolvableInstanceAttachmentsMap): InstanceAttachmentMap {
		const source = resolveInstanceAttachmentMapSource(input);

		return new this([source]);
	}

	private constructor(sources: readonly InstanceAttachmentMapSource[]) {
		super();

		for (const source of sources) {
			for (const entry of source.entries()) {
				const [key] = entry;

				// Skip the instance XML file: it's not an attachment!
				if (key === INSTANCE_FILE_NAME) {
					continue;
				}

				if (this.has(key)) {
					throw new MalformedInstanceDataError(
						`Unexpected InstanceData entry. Duplicate instance attachment for key: ${JSON.stringify(key)}`
					);
				}

				// assertInstanceDataEntry(entry);

				const [, value] = entry;

				this.set(key, value);
			}
		}
	}
}
