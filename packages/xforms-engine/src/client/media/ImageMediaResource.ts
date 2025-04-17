import type {
	BaseMediaResource,
	BaseMediaResourceDetail,
	MediaResourceTypeImage,
} from './BaseMediaResource.ts';
import type { MediaResourceURL } from './MediaResourceURL.ts';

export interface ImageMediaResourceDetail extends BaseMediaResourceDetail {
	readonly url: MediaResourceURL;
	readonly bigImageURL: MediaResourceURL | null;
}

export interface ImageMediaResource extends BaseMediaResource {
	readonly resourceType: MediaResourceTypeImage;
	readonly detail: ImageMediaResourceDetail;
}
