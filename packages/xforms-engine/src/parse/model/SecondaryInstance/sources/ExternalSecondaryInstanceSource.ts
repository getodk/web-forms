import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import type { DOMSecondaryInstanceElement } from '../../../XFormDOM.ts';
import type { ExternalSecondaryInstanceResource } from './ExternalSecondaryInstanceResource.ts';
import { SecondaryInstanceSource } from './SecondaryInstanceSource.ts';

export abstract class ExternalSecondaryInstanceSource extends SecondaryInstanceSource {
	override readonly resourceURL: JRResourceURL;

	constructor(
		domElement: DOMSecondaryInstanceElement,
		protected readonly resource: ExternalSecondaryInstanceResource
	) {
		const { format, instanceId, resourceURL } = resource;

		super(format, instanceId, resourceURL, domElement);

		this.resourceURL = resourceURL;
	}
}
