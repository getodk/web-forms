import type { AudioMediaResource } from './AudioMediaResource.ts';
import type { MediaResourceType } from './BaseMediaResource.ts';
import type { ImageMediaResource } from './ImageMediaResource.ts';
import type { VideoMediaResource } from './VideoMediaResource.ts';

interface MediaResourceByTypeSuffix {
	readonly MEDIA_RESOURCE_TYPE_AUDIO: AudioMediaResource;
	readonly MEDIA_RESOURCE_TYPE_IMAGE: ImageMediaResource;
	readonly MEDIA_RESOURCE_TYPE_VIDEO: VideoMediaResource;
}

// prettier-ignore
export type MediaResource<
	ResourceType extends MediaResourceType = MediaResourceType,
> = MediaResourceByTypeSuffix[ResourceType];
