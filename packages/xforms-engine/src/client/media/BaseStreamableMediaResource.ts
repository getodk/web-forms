import type { UnknownObject } from '@getodk/common/lib/type-assertions/assertUnknownObject.ts';
import type { Awaitable } from '@getodk/common/types/helpers.d.ts';
import type { BaseMediaResource, BaseMediaResourceDetail } from './BaseMediaResource.ts';
import type { MediaResourceURL } from './MediaResourceURL.ts';

export interface BaseStreamableMediaResourceDetail
	extends BaseMediaResourceDetail,
		// Note: we still have research to do into how we'll support streaming! Even
		// this interface is fairly speculative. It exists mainly to signal intent,
		// and as a baseline of the minimum expected surface/responsibilities.
		UnknownObject {
	getStream(): Awaitable<ReadableStream>;
	getURL(): Awaitable<MediaResourceURL>;
}

export interface BaseStreamableMediaResource extends BaseMediaResource {
	readonly detail: BaseStreamableMediaResourceDetail;
}
