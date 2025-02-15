<script setup lang="ts">
import InputGeopointReadonly from '@/components/controls/Input/InputGeopointReadonly.vue';
import type { GeopointInputNode, InputValue } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import PrimeDialog from 'primevue/dialog';
import PrimeProgressSpinner from 'primevue/progressspinner';
import { computed, inject, ref } from 'vue';

interface InputGeopointProps {
	readonly node: GeopointInputNode;
}

const props = defineProps<InputGeopointProps>();
const submitPressed = inject<boolean>('submitPressed');
const isInvalid = computed(() => props.node.validationState.violation?.valid === false);
const coords = ref<GeolocationCoordinates | null>(null);
const showDialog = ref(false);
const disabled = computed(() => props.node.currentState.readonly === true);
const geoLocationError = ref<boolean>(false);
const watchID = ref<number | null>(null);
const startTime = ref<number | null>(null);
const elapsedTime = ref(0);
// TODO: fix TypeScript check so it doesn't take types from NodeJS
let intervalID: NodeJS.Timeout | undefined;

const value = computed((): InputValue<'geopoint'> => {
	return props.node.currentState.value;
});

/**
 * Default accuracy in meters that can usually be reached by modern devices given enough time.
 */
const ACCURACY_THRESHOLD_DEFAULT = 5;
const accuracyThreshold = computed<number>(() => {
	return props.node.nodeOptions.accuracyThreshold ?? ACCURACY_THRESHOLD_DEFAULT;
});

/**
 * Default unacceptable accuracy in meters, which is about the length of a city block.
 */
const UNACCEPTABLE_ACCURACY_THRESHOLD_DEFAULT = 100;
const unacceptableAccuracyThreshold = computed<number>(() => {
	return (
		props.node.nodeOptions.unacceptableAccuracyThreshold ?? UNACCEPTABLE_ACCURACY_THRESHOLD_DEFAULT
	);
});

/**
 * Defines geolocation accuracy levels:
 *  - 'good' if accuracy is <= unacceptableAccuracyThreshold
 *  - 'poor' if accuracy > unacceptableAccuracyThreshold
 *  - 'unknown' if accuracy is null or undefined
 */
const ACCURACY_QUALITY = {
	good: 'good',
	poor: 'poor',
	unknown: 'unknown',
};

const qualityCoordinates = computed<string>(() => {
	const accuracy = coords.value?.accuracy;
	if (accuracy == null) {
		return ACCURACY_QUALITY.unknown;
	}

	if (accuracy > unacceptableAccuracyThreshold.value) {
		return ACCURACY_QUALITY.poor;
	}

	return ACCURACY_QUALITY.good;
});

const qualityLabel = computed<string>(() => {
	// TODO: translations
	if (qualityCoordinates.value === ACCURACY_QUALITY.good) {
		return 'Good';
	}

	if (qualityCoordinates.value === ACCURACY_QUALITY.poor) {
		return 'Poor';
	}

	return 'Unknown';
});

const formattedTime = computed(() => {
	const minutes = Math.floor(elapsedTime.value / 60);
	const seconds = (elapsedTime.value % 60).toString().padStart(2, '0');
	return `${minutes}:${seconds}`;
});

const start = () => {
	if (watchID.value) {
		stop();
	}

	showDialog.value = true;
	geoLocationError.value = false;

	startTime.value = Date.now();
	intervalID = setInterval(() => {
		if (startTime.value !== null) {
			elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000);
		}
	}, 1000);

	watchID.value = navigator.geolocation.watchPosition(
		(position) => {
			coords.value = position.coords;

			if (
				value.value === null &&
				accuracyThreshold.value !== 0 &&
				coords.value.accuracy <= accuracyThreshold.value
			) {
				save();
			}
		},
		() => {
			closeDialog();
			geoLocationError.value = true;
		},
		{ enableHighAccuracy: true }
	);
};

const stop = () => {
	if (watchID.value === null) {
		return;
	}

	navigator.geolocation.clearWatch(watchID.value);
	watchID.value = null;

	clearInterval(intervalID);
	elapsedTime.value = 0;
};

const save = () => {
	closeDialog();

	if (!coords.value) {
		return;
	}

	props.node.setValue({
		latitude: coords.value.latitude,
		longitude: coords.value.longitude,
		altitude: coords.value.altitude,
		accuracy: coords.value.accuracy,
	});
};

const closeDialog = () => {
	stop();
	showDialog.value = false;
};
</script>

<template>
	<div ref="controlElement" class="geolocation-control">
		<Button
			v-if="value == null"
			rounded
			class="get-location-button"
			:disabled="disabled"
			@click="start()"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				height="24px"
				viewBox="0 0 24 24"
				width="24px"
				fill="#5f6368"
			>
				<path d="M0 0h24v24H0V0z" fill="none" />
				<path
					d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 9.88C9.92 16.21 7 11.85 7 9z"
				/>
				<circle cx="12" cy="9" r="2.5" />
			</svg>
			<!-- TODO: translations -->
			<span>Get location</span>
		</Button>

		<div v-if="value != null" class="geolocation-value">
			<div class="geolocation-icons">
				<i v-if="qualityCoordinates === ACCURACY_QUALITY.poor" class="icon-warning" />
				<svg v-else class="icon-good-location" xmlns="http://www.w3.org/2000/svg" width="22" height="17" viewBox="0 0 22 17" fill="none">
					<path d="M7.49994 12.8668L2.63494 8.00177L0.978271 9.64677L7.49994 16.1684L21.4999 2.16844L19.8549 0.523438L7.49994 12.8668Z" fill="#3B82F6" />
				</svg>
			</div>
			<!-- TODO: translations -->
			<strong v-if="qualityLabel" class="geo-quality">{{ qualityLabel }} accuracy</strong>
			<InputGeopointReadonly :value="value" />
			<Button
				rounded
				outlined
				severity="contrast"
				class="retry-button"
				:disabled="disabled"
				@click="start()"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="15"
					height="14"
					viewBox="0 0 15 14"
					fill="none"
				>
					<g clip-path="url(#clip0_1092_687)">
						<path
							fill-rule="evenodd"
							clip-rule="evenodd"
							d="M7.27039 5.96336C7.34312 5.99355 7.42115 6.00891 7.4999 6.00854C7.57865 6.00891 7.65668 5.99355 7.72941 5.96336C7.80214 5.93317 7.86811 5.88876 7.92345 5.83273L10.3209 3.43529C10.4331 3.32291 10.4962 3.17058 10.4962 3.01175C10.4962 2.85292 10.4331 2.70058 10.3209 2.5882L7.92345 0.190763C7.86858 0.131876 7.80241 0.0846451 7.72889 0.0518865C7.65536 0.019128 7.576 0.00151319 7.49552 9.32772e-05C7.41505 -0.00132663 7.33511 0.0134773 7.26048 0.0436218C7.18585 0.0737664 7.11805 0.118634 7.06114 0.175548C7.00422 0.232462 6.95936 0.300257 6.92921 0.374888C6.89907 0.449519 6.88426 0.529456 6.88568 0.609933C6.8871 0.690409 6.90472 0.769775 6.93748 0.843296C6.97023 0.916817 7.01747 0.982986 7.07635 1.03786L8.45091 2.41241H7.49986C5.96325 2.41241 4.48957 3.02283 3.40302 4.10938C2.31647 5.19593 1.70605 6.66961 1.70605 8.20622C1.70605 9.74283 2.31647 11.2165 3.40302 12.3031C4.48957 13.3896 5.96325 14 7.49986 14C9.03582 13.9979 10.5083 13.3868 11.5944 12.3007C12.6805 11.2146 13.2916 9.74218 13.2937 8.20622C13.2937 8.04726 13.2305 7.89481 13.1181 7.78241C13.0057 7.67001 12.8533 7.60686 12.6943 7.60686C12.5353 7.60686 12.3829 7.67001 12.2705 7.78241C12.1581 7.89481 12.0949 8.04726 12.0949 8.20622C12.0949 9.11504 11.8255 10.0035 11.3205 10.7591C10.8156 11.5148 10.098 12.1037 9.25832 12.4515C8.41868 12.7993 7.49476 12.8903 6.6034 12.713C5.71204 12.5357 4.89328 12.0981 4.25064 11.4554C3.60801 10.8128 3.17037 9.99404 2.99307 9.10268C2.81576 8.21132 2.90676 7.2874 3.25455 6.44776C3.60234 5.60811 4.19131 4.89046 4.94697 4.38554C5.70263 3.88063 6.59104 3.61113 7.49986 3.61113H8.45086L7.07635 4.98564C6.96411 5.09802 6.90107 5.25035 6.90107 5.40918C6.90107 5.56801 6.96411 5.72035 7.07635 5.83273C7.13169 5.88876 7.19766 5.93317 7.27039 5.96336Z"
							fill="#64748B"
						/>
					</g>
					<defs>
						<clipPath id="clip0_1092_687">
							<rect width="14" height="14" fill="white" transform="translate(0.5)" />
						</clipPath>
					</defs>
				</svg>
				<!-- TODO: translations -->
				<span>Try again</span>
			</Button>
		</div>

		<div v-if="geoLocationError" class="geolocation-error" :class="{ 'stack-errors': submitPressed && isInvalid }">
			<i class="icon-warning" />
			<!-- TODO: translations -->
			<strong>Cannot access location</strong>&nbsp;<span>Grant location permission in the browser settings and make sure location is turned on.</span>
		</div>
	</div>

	<PrimeDialog :visible="showDialog" modal class="geo-dialog" :closable="false" :draggable="false">
		<template #header>
			<div class="geo-dialog-header">
				<div class="geo-dialog-header-title">
					<PrimeProgressSpinner class="spinner" stroke-width="4" />
					<!-- TODO: translations -->
					<strong>Finding your location</strong>
				</div>
				<button class="close-icon" @click="closeDialog()">
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
						<path d="M8.23648 6.99995L13.3931 1.84328C13.4791 1.76318 13.5481 1.66658 13.5959 1.55925C13.6437 1.45191 13.6694 1.33605 13.6715 1.21856C13.6736 1.10107 13.652 0.984374 13.608 0.875421C13.564 0.766468 13.4984 0.667495 13.4154 0.584407C13.3323 0.501318 13.2333 0.435816 13.1243 0.391808C13.0154 0.347801 12.8987 0.326188 12.7812 0.328261C12.6637 0.330334 12.5479 0.35605 12.4405 0.403874C12.3332 0.451698 12.2366 0.52065 12.1565 0.606618L6.99982 5.76328L1.84315 0.606618C1.67728 0.452058 1.45789 0.367914 1.23121 0.371914C1.00452 0.375913 0.788239 0.467744 0.627924 0.628059C0.467609 0.788375 0.375778 1.00466 0.371778 1.23134C0.367778 1.45803 0.451922 1.67741 0.606482 1.84328L5.76315 6.99995L0.606482 12.1566C0.442624 12.3207 0.350586 12.5431 0.350586 12.775C0.350586 13.0068 0.442624 13.2292 0.606482 13.3933C0.770545 13.5571 0.99294 13.6492 1.22482 13.6492C1.45669 13.6492 1.67909 13.5571 1.84315 13.3933L6.99982 8.23662L12.1565 13.3933C12.3205 13.5571 12.5429 13.6492 12.7748 13.6492C13.0067 13.6492 13.2291 13.5571 13.3931 13.3933C13.557 13.2292 13.649 13.0068 13.649 12.775C13.649 12.5431 13.557 12.3207 13.3931 12.1566L8.23648 6.99995Z" fill="#212121" />
					</svg>
				</button>
			</div>
		</template>

		<template #default>
			<div class="geo-dialog-body">
				<div v-if="coords?.accuracy != null" class="geolocation-icons">
					<i v-if="qualityCoordinates === ACCURACY_QUALITY.poor" class="icon-warning" />
					<svg v-else class="icon-good-location" xmlns="http://www.w3.org/2000/svg" width="22" height="17" viewBox="0 0 22 17" fill="none">
						<path d="M7.49994 12.8668L2.63494 8.00177L0.978271 9.64677L7.49994 16.1684L21.4999 2.16844L19.8549 0.523438L7.49994 12.8668Z" fill="#3B82F6" />
					</svg>
				</div>

				<div class="geolocation-information">
					<!-- TODO: translations -->
					<strong v-if="coords?.accuracy != null" class="geo-quality">{{ coords.accuracy }}m - {{ qualityLabel }} accuracy</strong>
					<p v-if="accuracyThreshold && value == null">
						Location will be saved at {{ accuracyThreshold }}m
					</p>
					<p>Time taken to capture location: {{ formattedTime }}</p>
					<p v-if="value?.accuracy">
						Previous saved location at {{ value.accuracy }}m
					</p>
				</div>
			</div>
		</template>

		<template #footer>
			<div class="geo-dialog-footer">
				<!-- TODO: translations -->
				<Button text rounded severity="contrast" label="Cancel" @click="closeDialog()" />

				<!-- TODO: translations -->
				<Button label="Save location" rounded :disabled="coords?.accuracy == null" @click="save()" />
			</div>
		</template>
	</PrimeDialog>
</template>

<style lang="scss">
@import 'primeflex/core/_variables.scss';

// Variable definition
.geolocation-control,
.geo-dialog-header,
.geo-dialog-body,
.geo-dialog-footer {
	--geo-spacing-s: 5px;
	--geo-spacing-m: 10px;
	--geo-spacing-l: 15px;
	--geo-spacing-xl: 30px;
	--geo-radius: 6px;
	--geo-title-font-size: 1.07rem;
	--geo-text-font-size: 0.9rem;
}

.geolocation-control {
	.get-location-button,
	.retry-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;

		svg {
			margin-right: var(--geo-spacing-s);
		}
	}

	.get-location-button {
		min-width: 270px;

		svg {
			fill: var(--surface-0);
		}

		&:disabled svg {
			fill: var(--surface-500);
		}
	}

	.retry-button {
		margin-left: auto;
		font-size: var(--geo-text-font-size);

		svg path {
			fill: var(--surface-900);
		}

		&:disabled svg path {
			fill: var(--surface-500);
		}
	}
}

.geo-dialog-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;

	.close-icon {
		background: none;
		border: none;
		cursor: pointer;
	}
}

.geo-dialog-header-title {
	display: flex;
	font-size: var(--geo-title-font-size);

	.spinner {
		width: 22px;
		height: 22px;
		margin-right: var(--geo-spacing-l);
	}
}

.geolocation-value,
.geo-dialog-body {
	display: flex;
	background: var(--surface-100);
	border-radius: var(--geo-radius);

	.geo-quality,
	.geolocation-icons {
		margin-right: var(--geo-spacing-l);
	}

	.icon-warning {
		font-size: 1.5rem;
		color: var(--error-text-color);
	}
}

.geolocation-value {
	font-size: var(--geo-text-font-size);
	display: flex;
	justify-content: flex-start;
	align-items: center;
	flex-wrap: wrap;
	padding: var(--geo-spacing-m) var(--geo-spacing-l);

	.geolocation-icons svg {
		width: 20px;
	}

	.icon-warning {
		font-size: 1.2rem;
	}
}

.geo-dialog-body {
	padding: var(--geo-spacing-xl);
	max-width: 450px;
	width: 80vw;
}

.geolocation-information {
	p {
		font-size: var(--geo-text-font-size);
		margin: var(--geo-spacing-s) 0;
	}

	strong {
		font-size: var(--geo-title-font-size);
		display: block;
		margin-bottom: var(--geo-spacing-m);
	}
}

.geo-dialog-footer button {
	margin: 0 0 var(--geo-spacing-m) var(--geo-spacing-l);
}

.geolocation-error {
	font-size: var(--geo-text-font-size);
	color: var(--error-text-color);
	background-color: var(--error-bg-color);
	border-radius: var(--geo-radius);
	margin-top: var(--geo-spacing-xl);
	padding: 20px;

	.icon-warning {
		font-size: 1.2rem;
		margin-right: var(--geo-spacing-s);
		vertical-align: text-bottom;
	}

	&.stack-errors {
		padding-left: 0;
	}
}

// Overriding PrimeDialog's styles
.p-dialog.geo-dialog {
	background: var(--surface-0);
}
</style>
