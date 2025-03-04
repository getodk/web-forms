import type { InstancePayload, InstancePayloadType } from '@getodk/xforms-engine';
import type { Ref } from 'vue';
import { inject, provide, ref } from 'vue';

export type AnyInstancePayload = InstancePayload<InstancePayloadType>;

export interface InstanceCacheItem {
	readonly cacheTimestamp: Date;
	readonly payload: AnyInstancePayload;
}

export interface InstanceCacheState {
	readonly items: readonly InstanceCacheItem[];
}

const defaultInstanceCacheState: InstanceCacheState = {
	items: [],
};

export const instanceCache: Ref<InstanceCacheState> =
	ref<InstanceCacheState>(defaultInstanceCacheState);

type SetItemsCallback = (items: readonly InstanceCacheItem[]) => readonly InstanceCacheItem[];

const setItems = (callback: SetItemsCallback): InstanceCacheState => {
	const current = instanceCache.value.items;

	instanceCache.value = {
		items: callback(current),
	};

	return instanceCache.value;
};

export const cacheInstance = (payload: AnyInstancePayload): InstanceCacheState => {
	return setItems((current) => [
		...current,
		{
			cacheTimestamp: new Date(),
			payload,
		},
	]);
};

export const evictCachedInstance = (instance: InstanceCacheItem): InstanceCacheState => {
	return setItems((items) => {
		return items.filter((item) => item !== instance);
	});
};

export const provideInstanceCache = () => {
	return provide<Ref<InstanceCacheState>, 'instanceCache'>('instanceCache', instanceCache);
};

export const injectInstanceCache = () => {
	return inject<Ref<InstanceCacheState>>('instance', instanceCache);
};

export const clearCache = (): InstanceCacheState => {
	return setItems(() => []);
};
