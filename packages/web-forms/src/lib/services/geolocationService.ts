/**
 * Singleton for geolocation. Ensures a single active watchPosition process.
 */
class GeolocationService {
	private static instance: GeolocationService | null = null;
	private watcherId: number | null = null;
	private activePromise: Promise<string> | null = null;
	private bestPoint: GeolocationPosition | undefined = undefined;
	private options: PositionOptions = { enableHighAccuracy: true };

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
	public getBestGeopoint(timeoutSeconds = 20): Promise<string> {
		if (this.activePromise) {
			return this.activePromise;
		}

		this.bestPoint = undefined;
		this.activePromise = new Promise((resolve, reject) => {
			if (!navigator.geolocation) {
				this.complete(resolve, reject, new Error('Geolocation is not supported by this browser.'));
			}

			this.watcherId = navigator.geolocation.watchPosition(
				(point) => {
					if (!this.bestPoint || point.coords.accuracy < this.bestPoint.coords.accuracy) {
						this.bestPoint = point;
					}
				},
				(error) => {
					this.complete(resolve, reject, new Error(`Geolocation error (code ${error.code})`));
				},
				this.options
			);
			setTimeout(() => {
				this.complete(
					resolve,
					reject,
					new Error('No geolocation readings received within the time window.')
				);
			}, timeoutSeconds * 1000);
		});
		return this.activePromise;
	}

	private formatGeopoint(position: GeolocationPosition): string {
		const { latitude, longitude, accuracy } = position.coords;
		const altitude = position.coords.altitude ?? 0;
		return `${latitude} ${longitude} ${altitude} ${accuracy}`;
	}

	private complete(
		resolveFn: (val: string) => void,
		rejectFn: (err: Error) => void,
		errorMessage: Error
	): void {
		if (this.bestPoint) {
			resolveFn(this.formatGeopoint(this.bestPoint));
		} else {
			rejectFn(errorMessage);
		}
		this.teardown();
	}

	public teardown(): void {
		this.bestPoint = undefined;
		if (this.watcherId !== null) {
			navigator.geolocation.clearWatch(this.watcherId);
			this.watcherId = null;
		}
		if (this.activePromise) {
			this.activePromise = null;
		}
	}
}

export const geolocationService = GeolocationService.getInstance();
