import type { AudioMediaResource } from './AudioMediaResource.ts';
import type { MediaResourceType } from './BaseMediaResource.ts';
import type { ImageMediaResource } from './ImageMediaResource.ts';
import type { UnknownMediaResource } from './UnknownMediaResource.ts';
import type { VideoMediaResource } from './VideoMediaResource.ts';

interface MediaResourceByTypeSuffix {
	readonly AUDIO: AudioMediaResource;
	readonly IMAGE: ImageMediaResource;
	readonly VIDEO: VideoMediaResource;
	readonly UNKNOWN: UnknownMediaResource;
}

// prettier-ignore
type MediaResourceTypeSuffix<ResourceType extends MediaResourceType> =
	ResourceType extends `MEDIA_RESOURCE_TYPE_${infer Suffix}`
		? Suffix
		: never;

// prettier-ignore
export type MediaResource<
	ResourceType extends MediaResourceType = MediaResourceType,
> = MediaResourceByTypeSuffix[MediaResourceTypeSuffix<ResourceType>];
