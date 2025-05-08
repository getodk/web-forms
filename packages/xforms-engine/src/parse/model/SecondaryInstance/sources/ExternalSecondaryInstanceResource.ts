import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import type { FetchResourceResponse } from '../../../../client/resources.ts';
import { ErrorProductionDesignPendingError } from '../../../../error/ErrorProductionDesignPendingError.ts';
import { getResponseContentType } from '../../../../lib/resource-helpers.ts';
import {
	FormAttachmentResource,
	type FormAttachmentResourceOptions,
} from '../../../attachments/FormAttachmentResource.ts';
import type { ExternalSecondaryInstanceSourceFormat } from './SecondaryInstanceSource.ts';

interface ExternalSecondaryInstanceResourceMetadata<
	Format extends ExternalSecondaryInstanceSourceFormat = ExternalSecondaryInstanceSourceFormat,
> {
	readonly contentType: string;
	readonly format: Format;
}

const inferSecondaryInstanceResourceMetadata = (
	resourceURL: JRResourceURL,
	contentType: string | null,
	data: string
): ExternalSecondaryInstanceResourceMetadata => {
	const url = resourceURL.href;

	let format: ExternalSecondaryInstanceSourceFormat | null = null;

	if (url.endsWith('.xml') && data.startsWith('<')) {
		format = 'xml';
	} else if (url.endsWith('.csv')) {
		format = 'csv';
	} else if (url.endsWith('.geojson') && data.startsWith('{')) {
		format = 'geojson';
	}

	if (format == null) {
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

	let format: ExternalSecondaryInstanceSourceFormat | null = null;

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
	}

	if (format == null) {
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

export class ExternalSecondaryInstanceResource<
	Format extends ExternalSecondaryInstanceSourceFormat = ExternalSecondaryInstanceSourceFormat,
> extends FormAttachmentResource<'secondary-instance'> {
	static async load(
		instanceId: string,
		resourceURL: JRResourceURL,
		options: FormAttachmentResourceOptions
	): Promise<ExternalSecondaryInstanceResource> {
		const { response, data, isBlank } = await FormAttachmentResource.fetchResource(
			'secondary-instance',
			resourceURL,
			options
		);

		if (isBlank) {
			return new ExternalSecondaryInstanceResource(
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

		return new ExternalSecondaryInstanceResource(
			response.status ?? null,
			instanceId,
			resourceURL,
			metadata,
			data,
			{
				isExplicitlyBlank: false,
			}
		);
	}

	readonly format: Format;
	readonly isBlank: boolean;

	private constructor(
		readonly responseStatus: number | null,
		readonly instanceId: string,
		resourceURL: JRResourceURL,
		metadata: ExternalSecondaryInstanceResourceMetadata<Format>,
		data: string,
		options: ExternalSecondaryInstanceResourceOptions
	) {
		const { contentType, format } = metadata;

		super('secondary-instance', resourceURL, contentType, data);

		this.format = format;

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

	isCSVResource(): this is ExternalSecondaryInstanceResource<'csv'> {
		return this.format === 'csv';
	}

	isGeoJSONResource(): this is ExternalSecondaryInstanceResource<'geojson'> {
		return this.format === 'geojson';
	}

	isXMLResource(): this is ExternalSecondaryInstanceResource<'xml'> {
		return this.format === 'xml';
	}
}
