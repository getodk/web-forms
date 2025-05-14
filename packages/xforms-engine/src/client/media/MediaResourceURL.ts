import type { PartiallyKnownString } from '@getodk/common/types/string/PartiallyKnownString.ts';

export interface MediaResourceURL extends URL {
	readonly protocol: PartiallyKnownString<'blob:' | 'data:'>;
}
