import type { GeopointValueObject } from './GeopointValueObject.ts';

// prettier-ignore
export type GeolocationRequestStatus =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| 'PENDING'
	| 'SUCCESS'
	| 'FAILURE';

interface BaseGeolocationRequestState {
	readonly status: GeolocationRequestStatus;
	readonly geopoint: GeopointValueObject | null;
	readonly error: GeolocationPositionError | null;
}

export interface GeolocationRequestPending extends BaseGeolocationRequestState {
	readonly status: 'PENDING';
	// Note: preserved from input
	readonly geopoint: GeopointValueObject | null;
	readonly error: null;
}

export interface GeolocationRequestSuccess extends BaseGeolocationRequestState {
	readonly status: 'SUCCESS';
	readonly geopoint: GeopointValueObject;
	readonly error: null;
}

export interface GeolocationRequestFailure extends BaseGeolocationRequestState {
	readonly status: 'FAILURE';
	readonly geopoint: null;
	readonly error: GeolocationPositionError;
}

// prettier-ignore
export type GeolocationRequestState =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| GeolocationRequestPending
	| GeolocationRequestSuccess
	| GeolocationRequestFailure;
