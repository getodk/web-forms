import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import type { FetchResource, FetchResourceResponse, MissingResourceBehavior } from '../../client';
import { ErrorProductionDesignPendingError } from '../../error/ErrorProductionDesignPendingError.ts';

export type FormAttachmentDataType = 'media' | 'secondary-instance';

/**
 * @todo This type anticipates work to support media form attachments, which
 * will tend to be associated with binary data. The
 * expectation is that:
 *
 * - {@link Blob} would be appropriate for representing data from attachment
 *   resources which are conventionally loaded to completion (where network
 *   conditions are favorable), such as images
 *
 * - {@link MediaSource} or {@link ReadableStream} may be more appropriate for
 *   representing data from resources which are conventionally streamed in a
 *   browser context (often regardless of network conditions), such as video and
 *   audio
 */
// prettier-ignore
export type FormAttachmentMediaData =
	| Blob
	| MediaSource
	| ReadableStream<unknown>;

export type FormAttachmentSecondaryInstanceData = string;

// prettier-ignore
type FormAttachmentData<DataType extends FormAttachmentDataType> =
	DataType extends 'media'
		? FormAttachmentMediaData
		: FormAttachmentSecondaryInstanceData;

export interface FormAttachmentResourceOptions {
	readonly fetchResource: FetchResource<JRResourceURL>;
	readonly missingResourceBehavior: MissingResourceBehavior;
}

export interface LoadResult<T extends FormAttachmentDataType> {
	response: FetchResourceResponse;
	data: FormAttachmentData<T>;
	isBlank: boolean;
}

export abstract class FormAttachmentResource<DataType extends FormAttachmentDataType> {
	protected constructor(
		readonly dataType: DataType,
		readonly resourceURL: JRResourceURL,
		readonly contentType: string,
		readonly data: FormAttachmentData<DataType>
	) {}

	protected static isMissingResource(response: FetchResourceResponse) {
		return response.status === 404;
	}

	protected static assertResponseSuccess(
		resourceURL: JRResourceURL,
		response: FetchResourceResponse
	) {
		const { ok = true, status = 200 } = response;

		if (!ok || status !== 200) {
			throw new ErrorProductionDesignPendingError(`Failed to load resource: ${resourceURL.href}`);
		}
	}

	protected static async fetchResource<T extends FormAttachmentDataType>(
		dataType: T,
		resourceURL: JRResourceURL,
		options: FormAttachmentResourceOptions
	): Promise<LoadResult<T>> {
		const { fetchResource, missingResourceBehavior } = options;
		const response = await fetchResource(resourceURL);

		if (this.isMissingResource(response)) {
			if (missingResourceBehavior === 'BLANK') {
				const blankData = dataType === 'media' ? new Blob() : '';
				return { response, isBlank: true, data: blankData as FormAttachmentData<T> };
			}
			throw new ErrorProductionDesignPendingError(`Resource not found: ${resourceURL.href}`);
		}

		this.assertResponseSuccess(resourceURL, response);

		const data = dataType === 'media' ? await response.blob() : await response.text();
		return { response, isBlank: false, data: data as FormAttachmentData<T> };
	}
}
