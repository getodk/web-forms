<script setup lang="ts">
import PrimeButton from 'primevue/button';
import type { AnyInstance, InstantiableFormResult } from '../shared-state/form-state.ts';
import { instantiableFormResult, restoreInstanceState } from '../shared-state/form-state.ts';
import type { InstanceCacheItem } from '../shared-state/instance-cache-state.ts';
import {
	clearCache,
	evictCachedInstance,
	instanceCache,
} from '../shared-state/instance-cache-state.ts';

const formatTimeUnit = (timeUnit: number): string => {
	return timeUnit.toString().padStart(2, '0');
};

const formatTimestamp = (date: Date): string => {
	const hours = date.getHours();
	const minutes = date.getMinutes();
	const seconds = date.getSeconds();

	return [hours, minutes, seconds].map(formatTimeUnit).join(':');
};

const restoreCacheItem = async (
	formResult: InstantiableFormResult,
	item: InstanceCacheItem
): Promise<AnyInstance> => {
	const instance = await restoreInstanceState(formResult, item.payload);

	evictCachedInstance(item);

	return instance;
};
</script>

<template>
	<section v-if="instantiableFormResult" class="demo-instance-cache">
		<details>
			<summary>Instance cache</summary>

			<p>This is an in-memory demo simulating storage and restoration of instance state, which might be similar to the experience of a Web Forms offline mode.</p>

			<template v-if="instanceCache.items.length > 0">
				<div class="cache-header flex">
					<span>Cached instances ({{ instanceCache.items.length }})</span>

					<PrimeButton
						text
						@click="clearCache()"
					>
						Clear
					</PrimeButton>
				</div>

				<ul class="items">
					<li v-for="item in instanceCache.items" :key="item.cacheTimestamp.getDate()">
						<div class="item-row flex">
							<PrimeButton
								title="Remove from cache"
								class="remove-item"
								@click="evictCachedInstance(item)"
							>
								✕
							</PrimeButton>

							<div class="item-description">
								Instance cached at {{ formatTimestamp(item.cacheTimestamp) }}
							</div>

							<PrimeButton class="restore-item" @click="restoreCacheItem(instantiableFormResult, item)">
								Restore instance
							</PrimeButton>
						</div>
					</li>
				</ul>
			</template>
			<template v-else>
				<p class="cache-empty">
					Cache is empty!
				</p>
			</template>
		</details>
	</section>
</template>

<style scoped lang="scss">
.demo-instance-cache {
	padding: 1rem;
	background-color: var(--surface-0);
}

summary {
	cursor: pointer;
}

.flex {
	display: flex;
	gap: 0.5rem;
	align-items: center;
}

.cache-empty {
	font-size: 0.85rem;
}

.cache-header {
	justify-content: space-between;
}

.items,
.items li {
	display: block;
	list-style: none;
}

.items {
	margin: 0;
	padding: 0;
}

.items li {
	margin: 0;
	padding: 0.25rem;
}

.item-description {
	flex-grow: 1;
}

.remove-item {
	display: block;
	width: 1.5rem;
	min-width: 0;
	height: 1.5rem;
	padding: 0;
}
</style>
