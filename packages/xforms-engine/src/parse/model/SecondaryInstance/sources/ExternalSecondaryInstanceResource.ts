import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import type { FetchResourceResponse } from '../../../../client/resources.ts';
import { ErrorProductionDesignPendingError } from '../../../../error/ErrorProductionDesignPendingError.ts';
import { getResponseContentType } from '../../../../lib/resource-helpers.ts';
import {
	FormAttachmentResource,
	type FormAttachmentResourceOptions,
} from '../../../attachments/FormAttachmentResource.ts';
import type { ExternalSecondaryInstanceSourceFormat } from './SecondaryInstanceSource.ts';

interface ExternalSecondaryInstanceResourceMetadata {
	readonly contentType: string;
	readonly format: ExternalSecondaryInstanceSourceFormat;
}

const inferSecondaryInstanceResourceMetadata = (
	resourceURL: JRResourceURL,
	contentType: string | null,
	data: string
): ExternalSecondaryInstanceResourceMetadata => {
	const url = resourceURL.href;

	let format: ExternalSecondaryInstanceSourceFormat;

	if (url.endsWith('.xml') && data.startsWith('<')) {
		format = 'xml';
	} else if (url.endsWith('.csv')) {
		format = 'csv';
	} else if (url.endsWith('.geojson') && data.startsWith('{')) {
		format = 'geojson';
	} else {
		throw new ErrorProductionDesignPendingError(
			`Failed to infer external secondary instance format/content type for resource ${url} (response content type: ${contentType}, data: ${data})`
		);
	}

	return {
		contentType: contentType ?? 'text/plain',
		format,
	};
};

const detectSecondaryInstanceResourceMetadata = (
	resourceURL: JRResourceURL,
	response: FetchResourceResponse,
	data: string
): ExternalSecondaryInstanceResourceMetadata => {
	const contentType = getResponseContentType(response);

	if (contentType == null || contentType === 'text/plain') {
		return inferSecondaryInstanceResourceMetadata(resourceURL, contentType, data);
	}

	let format: ExternalSecondaryInstanceSourceFormat;

	switch (contentType) {
		case 'text/csv':
			format = 'csv';
			break;

		case 'application/geo+json':
			format = 'geojson';
			break;

		case 'text/xml':
			format = 'xml';
			break;

		default:
			throw new ErrorProductionDesignPendingError(
				`Failed to detect external secondary instance format for resource ${resourceURL.href} (response content type: ${contentType}, data: ${data})`
			);
	}

	return {
		contentType,
		format,
	};
};

interface ExternalSecondaryInstanceResourceOptions {
	readonly isExplicitlyBlank?: boolean;
}

interface ExternalSecondaryInstanceLoadResult {
	response: FetchResourceResponse;
	data: string;
	isBlank: boolean;
}

export class ExternalSecondaryInstanceResource extends FormAttachmentResource {
	static async load(
		instanceId: string,
		resourceURL: JRResourceURL,
		options: FormAttachmentResourceOptions
	): Promise<ExternalSecondaryInstanceResource> {
		const { response, data, isBlank } = await this.fetch(resourceURL, options);

		if (isBlank) {
			return new this(
				response.status ?? null,
				instanceId,
				resourceURL,
				{
					format: 'xml',
					contentType: 'text/xml',
				},
				'',
				{ isExplicitlyBlank: true }
			);
		}

		const metadata = detectSecondaryInstanceResourceMetadata(resourceURL, response, data);

		return new this(response.status ?? null, instanceId, resourceURL, metadata, data, {
			isExplicitlyBlank: false,
		});
	}

	private static async fetch(
		resourceURL: JRResourceURL,
		options: FormAttachmentResourceOptions
	): Promise<ExternalSecondaryInstanceLoadResult> {
		const { fetchResource, missingResourceBehavior } = options;
		const response = await fetchResource(resourceURL);

		if (this.isMissingResource(response)) {
			if (missingResourceBehavior === 'BLANK') {
				return { response, isBlank: true, data: '' };
			}
			throw new ErrorProductionDesignPendingError(`Resource not found: ${resourceURL.href}`);
		}

		this.assertResponseSuccess(resourceURL, response);

		return { response, isBlank: false, data: await response.text() };
	}

	readonly format: ExternalSecondaryInstanceSourceFormat;
	readonly data: string;
	readonly isBlank: boolean;

	private constructor(
		readonly responseStatus: number | null,
		readonly instanceId: string,
		resourceURL: JRResourceURL,
		metadata: ExternalSecondaryInstanceResourceMetadata,
		data: string,
		options: ExternalSecondaryInstanceResourceOptions
	) {
		const { contentType, format } = metadata;

		super(resourceURL, contentType);

		this.format = format;
		this.data = data;

		if (data === '') {
			if (options.isExplicitlyBlank) {
				this.isBlank = true;
			} else {
				throw new ErrorProductionDesignPendingError(
					`Failed to load blank external secondary instance ${resourceURL.href}`
				);
			}
		} else {
			this.isBlank = false;
		}
	}
}
