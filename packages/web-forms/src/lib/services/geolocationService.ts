import type { TimerID } from '@getodk/common/types/timers.ts';

/**
 * Singleton for geolocation. Ensures a single active watchPosition process.
 */
class GeolocationService {
	private static instance: GeolocationService | null = null;
	private watcherId: number | null = null;
	private timerId: TimerID | null = null;
	private activePromise: Promise<string> | null = null;
	private bestPoint: GeolocationPosition | undefined = undefined;
	private options: PositionOptions = { enableHighAccuracy: true };

	private pendingResolve: ((val: string) => void) | null = null;
	private pendingReject: ((err: Error) => void) | null = null;

	public static getInstance(): GeolocationService {
		GeolocationService.instance ??= new GeolocationService();
		return GeolocationService.instance;
	}

	/**
	 * Collects geolocation readings for a fixed time window and returns the most accurate
	 * result (lowest accuracy value) in ODK geopoint format: "latitude longitude altitude accuracy".
	 *
	 * If at least one reading is received, the best one is returned.
	 * If no readings are received, or an error occurs before any reading, the operation fails.
	 *
	 * @param timeoutSeconds - Seconds to collect readings (default: 20).
	 * @returns A promise resolving to an ODK geopoint string.
	 * @throws Error if geolocation is unsupported, no readings received, or a geolocation error occurs.
	 */
	public async getBestGeopoint(timeoutSeconds = 20): Promise<string> {
		if (this.activePromise) {
			return this.activePromise;
		}

		if (!navigator.geolocation) {
			// TODO: translations
			return Promise.reject(new Error('Geolocation is not supported by this browser.'));
		}

		this.bestPoint = undefined;

		const promise = new Promise<string>((resolve, reject) => {
			this.pendingResolve = resolve;
			this.pendingReject = reject;

			this.watcherId = navigator.geolocation.watchPosition(
				(point) => {
					// Keep the point with the lowest accuracy value (smaller is better)
					if (!this.bestPoint || point.coords.accuracy < this.bestPoint.coords.accuracy) {
						this.bestPoint = point;
					}
				},
				(error) => {
					// TODO: translations
					this.resolveNow(new Error(`Geolocation error (code ${error.code})`));
				},
				this.options
			);
			this.timerId = setTimeout(() => {
				// TODO: translations
				this.resolveNow(new Error('No geolocation readings received within the time window.'));
			}, timeoutSeconds * 1000);
		});

		this.activePromise = promise;
		return promise;
	}

	/**
	 * Stops the watcher immediately.
	 * If we have a location reading, resolves the promise with it.
	 * If we have no readings, rejects with the provided error.
	 */
	public resolveNow(error: Error): void {
		if (!this.pendingResolve || !this.pendingReject) {
			return;
		}

		if (this.bestPoint) {
			this.pendingResolve(this.formatGeopoint(this.bestPoint));
		} else {
			this.pendingReject(error);
		}

		this.teardown();
	}

	private formatGeopoint(position: GeolocationPosition): string {
		const { latitude, longitude, accuracy } = position.coords;
		const altitude = position.coords.altitude ?? 0;
		return `${latitude} ${longitude} ${altitude} ${accuracy}`;
	}

	public teardown(): void {
		if (this.watcherId !== null) {
			navigator.geolocation.clearWatch(this.watcherId);
			this.watcherId = null;
		}
		if (this.timerId !== null) {
			clearTimeout(this.timerId);
			this.timerId = null;
		}
		this.activePromise = null;
		this.bestPoint = undefined;
		this.pendingResolve = null;
		this.pendingReject = null;
	}
}

export const geolocationService = GeolocationService.getInstance();
