import type { UnknownObject } from '@getodk/common/lib/type-assertions/assertUnknownObject.ts';
import type {
	BaseMediaResource,
	BaseMediaResourceDetail,
	MediaResourceTypeUnknown,
} from './BaseMediaResource.ts';

export interface UnknownMediaResourceDetail extends BaseMediaResourceDetail, UnknownObject {}

export interface UnknownMediaResource extends BaseMediaResource {
	readonly resourceType: MediaResourceTypeUnknown;
	readonly detail: UnknownMediaResourceDetail;
}
