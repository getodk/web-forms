<script setup lang="ts">
import type { GeopointInputNode } from '@getodk/xforms-engine';
import { computed, ref } from 'vue';

interface InputGeopointProps {
	readonly node: GeopointInputNode;
}

const props = defineProps<InputGeopointProps>();
let watchID: number | null = null;
const coords = ref<GeolocationCoordinates | null>(null);
const value = computed(() => {
	return props.node.currentState.value;
});

const start = () => {
	if (watchID) {
		stop();
	}

	watchID = navigator.geolocation.watchPosition(
		(position) => {
			coords.value = position.coords;
		},
		(error) => console.error(error),
		{ enableHighAccuracy: true }
	);
};

const stop = () => {
	if (watchID === null) {
		return;
	}
	navigator.geolocation.clearWatch(watchID);
	watchID = null;
};

const save = () => {
	if (!coords.value) {
		return;
	}

	const { latitude, longitude, altitude, accuracy } = coords.value;
	props.node.setValue([latitude, longitude, altitude, accuracy].join(' '));
};
</script>

<template>
	<p>realtime value: {{ coords }}</p>
	<p>saved value: {{ value }}</p>
	<button @click="start()">start</button>
	<button @click="stop()">stop</button>
	<button @click="save()">save</button>
</template>

<style scoped lang="scss"></style>
