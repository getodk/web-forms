import type { MediaResourceTypeAudio } from './BaseMediaResource.ts';
import type { BaseStreamableMediaResource } from './BaseStreamableMediaResource.ts';

export interface AudioMediaResource extends BaseStreamableMediaResource {
	readonly resourceType: MediaResourceTypeAudio;
}
