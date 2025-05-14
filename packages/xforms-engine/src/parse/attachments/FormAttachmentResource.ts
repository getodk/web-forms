import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import type { FetchResource, FetchResourceResponse, MissingResourceBehavior } from '../../client';
import { ErrorProductionDesignPendingError } from '../../error/ErrorProductionDesignPendingError.ts';

export interface FormAttachmentResourceOptions {
	readonly fetchResource: FetchResource<JRResourceURL>;
	readonly missingResourceBehavior: MissingResourceBehavior;
}

export abstract class FormAttachmentResource {
	protected constructor(
		readonly resourceURL: JRResourceURL,
		readonly contentType: string
	) {}

	protected static isMissingResource(response: FetchResourceResponse) {
		return response.status === 404;
	}

	protected static handleMissingResource(resourceURL: JRResourceURL) {
		throw new ErrorProductionDesignPendingError(`Resource not found: ${resourceURL.href}`);
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
}
