import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import type { FetchResourceResponse } from '../../client/resources.ts';
import { getResponseContentType } from '../../lib/resource-helpers.ts';
import {
	FormAttachmentResource,
	type FormAttachmentResourceOptions,
} from './FormAttachmentResource.ts';

export class MediaResource extends FormAttachmentResource {
	static async load(
		resourceURL: JRResourceURL,
		options: FormAttachmentResourceOptions
	): Promise<MediaResource> {
		const { response, data } = await this.fetch(resourceURL, options);

		const contentType = getResponseContentType(response) ?? 'application/octet-stream';

		return new MediaResource(resourceURL, contentType, data);
	}

	private static async fetch(
		resourceURL: JRResourceURL,
		options: FormAttachmentResourceOptions
	): Promise<MediaLoadResult> {
		const { fetchResource, missingResourceBehavior } = options;
		const response = await fetchResource(resourceURL);

		if (this.isMissingResource(response)) {
			if (missingResourceBehavior === 'BLANK') {
				return { response, data: new Blob() };
			}
			this.handleMissingResource(resourceURL);
		}

		this.assertResponseSuccess(resourceURL, response);

		return { response, data: await response.blob() };
	}

	readonly data: Blob;

	private constructor(resourceURL: JRResourceURL, contentType: string, data: Blob) {
		super(resourceURL, contentType);
		this.data = data;
	}
}

interface MediaLoadResult {
	response: FetchResourceResponse;
	data: Blob;
}
