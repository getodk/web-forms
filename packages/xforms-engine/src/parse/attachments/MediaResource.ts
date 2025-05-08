import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import { getResponseContentType } from '../../lib/resource-helpers.ts';
import {
	FormAttachmentResource,
	type FormAttachmentResourceOptions,
} from './FormAttachmentResource.ts';

export class MediaResource extends FormAttachmentResource<'media'> {
	static async load(
		resourceURL: JRResourceURL,
		options: FormAttachmentResourceOptions
	): Promise<MediaResource> {
		const { response, data, isBlank } = await FormAttachmentResource.fetchResource(
			'media',
			resourceURL,
			options
		);

		const BINARY_MIME_TYPE = 'application/octet-stream';
		const contentType = isBlank
			? BINARY_MIME_TYPE
			: (getResponseContentType(response) ?? BINARY_MIME_TYPE);

		return new MediaResource(resourceURL, contentType, data as Blob);
	}

	private constructor(resourceURL: JRResourceURL, contentType: string, data: Blob) {
		super('media', resourceURL, contentType, data);
	}
}
