import type { Awaitable } from '@getodk/common/types/helpers.js';

export type MediaResourceTypeAudio = 'MEDIA_RESOURCE_TYPE_AUDIO';
export type MediaResourceTypeVideo = 'MEDIA_RESOURCE_TYPE_VIDEO';
export type MediaResourceTypeImage = 'MEDIA_RESOURCE_TYPE_IMAGE';
export type MediaResourceTypeUnknown = 'MEDIA_RESOURCE_TYPE_UNKNOWN';

export type MediaResourceType =
	| MediaResourceTypeAudio
	| MediaResourceTypeImage
	| MediaResourceTypeUnknown
	| MediaResourceTypeVideo;

export interface BaseMediaResourceDetail {
	readonly fileName: string;

	getResourceData(): Awaitable<Blob>;
}

export interface BaseMediaResource {
	readonly resourceType: MediaResourceType;
	readonly detail: BaseMediaResourceDetail;
}
