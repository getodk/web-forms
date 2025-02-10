<script setup lang="ts">
import type { GeopointInputNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import PrimeProgressSpinner from 'primevue/progressspinner';
import { inject, computed, ref } from 'vue';

interface InputGeopointProps {
	readonly node: GeopointInputNode;
}

const props = defineProps<InputGeopointProps>();
const coords = ref<GeolocationCoordinates | null>(null);

interface Coordinates {
	latitude: string;
	longitude: string;
	altitude: string;
	accuracy: string;
}

const value = computed((): Coordinates | null => {
	if (!props.node.currentState.value?.length) {
		return null;
	}

	const [latitude, longitude, altitude, accuracy] = props.node.currentState.value.trim().split(' ');
	return { latitude, longitude, altitude, accuracy };
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

const disabled = computed(() => props.node.currentState.readonly === true);
const geoLocationError = ref<boolean>(false);
const watchID = ref<number | null>(null);
const isLocating = computed(() => {
	return watchID.value !== null;
});

const controlElement = ref<HTMLElement | null>(null);
// Autosave geopoint when control leaves the viewport as the user scrolls.
const controlElementObserver = new IntersectionObserver(
	([entry]) => {
		if (!entry.isIntersecting) {
			save();
		}
	},
	{ threshold: 0.6 }
);

const registerBeforeSubmit = inject<(callback: () => void) => void>('registerBeforeSubmit');
// Autosave geopoint value before submitting the form.
registerBeforeSubmit?.(() => save());

const start = () => {
	geoLocationError.value = false;
	if (watchID.value) {
		stop();
	}

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
			stop();
			geoLocationError.value = true;
		},
		{ enableHighAccuracy: true }
	);

	if (controlElementObserver && controlElement.value) {
		controlElementObserver.observe(controlElement.value);
	}
};

const stop = () => {
	if (watchID.value === null) {
		return;
	}

	navigator.geolocation.clearWatch(watchID.value);
	watchID.value = null;
	controlElementObserver?.disconnect();
};

const save = () => {
	stop();

	if (!coords.value) {
		return;
	}

	const { latitude, longitude, altitude, accuracy } = coords.value;
	// ToDo: if one is missing, it still need to know the position of the others.
	// ToDo: Change the value type to object? or default to negative / zero number?
	props.node.setValue([latitude ?? 0, longitude ?? 0, altitude ?? 0, accuracy ?? 0].join(' '));
};

const formatNumber = (num: number) => {
	const decimals = Number.isInteger(num) ? 0 : 2;
	return num.toFixed(decimals);
};
</script>

<template>
	<div ref="controlElement" class="geolocation-control">
		<Button
			v-if="value === null && !isLocating"
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

		<div v-else class="geolocation-container">
			<div class="geolocation-result">
				<div class="geolocation-icons">
					<svg v-if="disabled || qualityCoordinates === ACCURACY_QUALITY.good" class="icon-good-location" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
						<g clip-path="url(#clip0_1090_14860)">
							<path fill-rule="evenodd" clip-rule="evenodd" d="M13.381 27.8037C13.5611 27.9334 13.7779 28.0021 13.9999 27.9999C14.2218 28.0021 14.4386 27.9334 14.6187 27.8037C15.1319 27.5169 25.6979 20.3773 25.6979 11.6981C25.6979 8.59556 24.4655 5.62011 22.2717 3.42629C20.0778 1.23247 17.1024 0 13.9999 0C10.8973 0 7.92187 1.23247 5.72805 3.42629C3.53423 5.62011 2.30176 8.59556 2.30176 11.6981C2.30176 20.3773 12.9282 27.5169 13.381 27.8037ZM7.34685 5.06722C9.11563 3.31259 11.5084 2.33159 13.9999 2.33962C16.4913 2.33159 18.8841 3.31259 20.6528 5.06722C22.4216 6.82184 23.4218 9.20668 23.4338 11.6981C23.4338 18.0528 16.2036 23.8641 13.9999 25.4792C11.7961 23.8641 4.5659 18.0528 4.5659 11.6981C4.57789 9.20668 5.57807 6.82184 7.34685 5.06722ZM11.6937 14.4702C12.3763 14.9263 13.1788 15.1698 13.9998 15.1698C15.1007 15.1698 16.1565 14.7325 16.935 13.954C17.7134 13.1756 18.1508 12.1198 18.1508 11.0189C18.1508 10.1979 17.9073 9.39534 17.4512 8.71272C16.9951 8.0301 16.3468 7.49807 15.5883 7.18389C14.8298 6.86972 13.9952 6.78752 13.19 6.94768C12.3848 7.10785 11.6452 7.50318 11.0647 8.0837C10.4841 8.66422 10.0888 9.40385 9.92864 10.2091C9.76847 11.0143 9.85068 11.8489 10.1649 12.6074C10.479 13.3658 11.0111 14.0141 11.6937 14.4702ZM12.9516 9.45005C13.2619 9.24273 13.6266 9.13207 13.9998 9.13207C14.5002 9.13207 14.9801 9.33085 15.334 9.6847C15.6878 10.0385 15.8866 10.5184 15.8866 11.0189C15.8866 11.392 15.7759 11.7568 15.5686 12.0671C15.3613 12.3774 15.0666 12.6192 14.7219 12.762C14.3771 12.9048 13.9977 12.9422 13.6317 12.8694C13.2657 12.7966 12.9295 12.6169 12.6657 12.353C12.4018 12.0891 12.2221 11.753 12.1493 11.387C12.0765 11.021 12.1138 10.6416 12.2566 10.2968C12.3995 9.95205 12.6413 9.65737 12.9516 9.45005Z" fill="#3B82F6" />
						</g>
						<defs>
							<clipPath id="clip0_1090_14860">
								<rect width="28" height="28" fill="white" />
							</clipPath>
						</defs>
					</svg>
					<i v-if="!disabled && qualityCoordinates === ACCURACY_QUALITY.poor" class="icon-warning" />
					<PrimeProgressSpinner v-if="!disabled && qualityCoordinates === ACCURACY_QUALITY.unknown" class="spinner" stroke-width="4" />
				</div>

				<div class="geolocation-labels">
					<!-- TODO: translations -->
					<strong v-if="disabled">Location captured</strong>
					<strong v-if="!disabled && !coords?.accuracy">Getting location - please wait!</strong>
					<strong v-if="!disabled && coords?.accuracy">{{ formatNumber(coords.accuracy) }}m - {{ qualityLabel }} accuracy</strong>
					<p v-if="!disabled && value === null && isLocating">
						Location will be saved at {{ accuracyThreshold }}m
					</p>
					<p>
						<span v-if="value?.latitude != null">
							Latitude: {{ value.latitude }}
						</span>
						<span v-if="value?.longitude != null">
							Longitude: {{ value.longitude }}
						</span>
					</p>
					<p>
						<span v-if="value?.altitude != null">
							Altitude: {{ value.altitude }}
						</span>
						<span v-if="value?.accuracy != null">
							Accuracy: {{ formatNumber(Number(value.accuracy)) }}m
						</span>
					</p>
				</div>
			</div>

			<div v-if="!disabled" class="geolocation-buttons">
				<!-- TODO: translations -->
				<Button v-if="isLocating" text rounded label="Cancel" @click="stop()" />

				<!-- TODO: translations -->
				<Button v-if="isLocating" label="Save location" rounded @click="save()" />

				<Button
					v-if="value !== null && !isLocating"
					rounded
					outlined
					severity="contrast"
					class="retry-button"
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
		</div>

		<div v-if="geoLocationError" class="geolocation-error">
			<i class="icon-warning" />
			<!-- TODO: translations -->
			<strong>Cannot access location</strong>&nbsp;<span>Grant location permission in the browser settings and make sure location is turned on.</span>
		</div>
	</div>
</template>

<style scoped lang="scss">
@import 'primeflex/core/_variables.scss';

// Variable definition to root element
.geolocation-control {
	--geo-spacing-s: 5px;
	--geo-spacing-m: 10px;
	--geo-spacing-l: 15px;
	--geo-radius: 10px;
}

.geolocation-container {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	width: 50%;
	background: var(--surface-50);
	border: 1px solid var(--surface-200);
	border-radius: var(--geo-radius);
	padding: 22px;
}

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

.retry-button svg path {
	fill: var(--surface-900);
}

.geolocation-buttons button {
	margin-left: var(--geo-spacing-l);
}

.geolocation-result {
	display: flex;
	width: 100%;
	margin-bottom: var(--geo-spacing-l);
}

.geolocation-labels {
	margin-top: var(--geo-spacing-s);

	p {
		font-size: 0.85rem;
	}

	p > span {
		margin-right: var(--geo-spacing-s);
	}
}

.geolocation-icons {
	margin-right: var(--geo-spacing-l);

	.icon-good-location,
	.spinner {
		width: 28px;
		height: 28px;
	}

	.icon-warning {
		font-size: 1.5rem;
		color: var(--error-text-color);
	}
}

.geolocation-error {
	color: var(--error-text-color);
	background-color: var(--error-bg-color);
	border-radius: var(--geo-radius);
	margin-top: var(--geo-spacing-m);
	padding: 20px;

	.icon-warning {
		font-size: 1.2rem;
		margin-right: var(--geo-spacing-s);
		vertical-align: text-bottom;
	}
}

@media screen and (max-width: #{$md}) {
	.geolocation-container {
		width: 100%;
	}
}
</style>
