import type { MediaResourceTypeVideo } from './BaseMediaResource.ts';
import type { BaseStreamableMediaResource } from './BaseStreamableMediaResource.ts';

export interface VideoMediaResource extends BaseStreamableMediaResource {
	readonly resourceType: MediaResourceTypeVideo;
}
