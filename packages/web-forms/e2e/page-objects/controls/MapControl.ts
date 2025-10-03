import { expect, Locator, Page } from '@playwright/test';

export class MapControl {
	private readonly MAP_CONTAINER_SELECTOR = '.map-container';
	private readonly MAP_SELECTOR = '.map-block';
	private readonly ANIMATION_TIME = 1000;
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async expectMapVisible(label: string) {
		const container = this.page
			.locator('.question-container')
			.filter({ has: this.page.locator(`.control-text label span:text-is("${label}")`) });

		const map = container.locator(this.MAP_SELECTOR);

		await expect(map, `Map for label "${label}" not found`).toBeVisible();

		// Playwright's scrollIntoViewIfNeeded() scrolls minimally and doesn't guarantee to center
		// the element, so JavaScript scroll is used to ensure the map is centered and fully visible.
		const handle = await map.elementHandle();
		if (handle) {
			await handle.evaluate((el) => el.scrollIntoView({ block: 'center' }));
		}
	}

	async zoomToFitAll() {
		const button = this.page.locator('button[title="Zoom to fit all options"]');
		await expect(button).toBeVisible();
		await button.click();
		await this.page.waitForTimeout(this.ANIMATION_TIME);
	}

	async zoomIn(times = 1) {
		const button = this.page
			.locator(`${this.MAP_CONTAINER_SELECTOR} .ol-zoom`)
			.getByText('+', { exact: true });
		await expect(button).toBeVisible();
		for (let i = 0; i < times; i++) {
			await button.click();
			await this.page.waitForTimeout(this.ANIMATION_TIME);
		}
	}

	async zoomOut(times = 1) {
		const button = this.page
			.locator(`${this.MAP_CONTAINER_SELECTOR} .ol-zoom`)
			.getByText('–', { exact: true });
		await expect(button).toBeVisible();
		for (let i = 0; i < times; i++) {
			await button.click();
			await this.page.waitForTimeout(this.ANIMATION_TIME);
		}
	}

	async panMap(times = 1) {
		await this.page.mouse.move(600, 360);
		await this.page.mouse.down();
		await this.page.mouse.move(900, -500, { steps: times });
		await this.page.mouse.up();
		await this.page.waitForTimeout(this.ANIMATION_TIME);
		await this.page.waitForTimeout(this.ANIMATION_TIME);
	}

	async centerCurrentLocation() {
		const button = this.page.locator('button[title="Zoom to current location"]');
		await expect(button).toBeVisible();
		await button.click();
		await this.page.waitForTimeout(this.ANIMATION_TIME);
	}

	async toggleFullScreen() {
		const button = this.page.locator('button[title="Full Screen"]');
		await expect(button).toBeVisible();
		await button.click();
		await this.page.waitForTimeout(this.ANIMATION_TIME);
	}

	async expectFullScreenActive() {
		await expect(this.page.locator(`${this.MAP_CONTAINER_SELECTOR}.map-full-screen`)).toBeVisible();
	}

	/**
	 *	Selects feature on map
	 * @param positionX Relative to the left of the browser's viewport.
	 * @param positionY Relative to the top of the browser's viewport.
	 */
	async selectFeatureByClick(positionX: number, positionY: number) {
		await this.page.mouse.move(positionX, positionY);
		await this.page.mouse.down();
		await this.page.mouse.up();
		await this.page.waitForTimeout(this.ANIMATION_TIME);
	}

	async expectPropertiesVisible(title: string) {
		const titleLocator = this.page
			.locator('.map-properties')
			.filter({ has: this.page.locator(`.map-properties-header strong:text-is("${title}")`) });
		await expect(titleLocator, `Map's properties for feature "${title}" not found`).toBeVisible();
	}

	async saveSelection() {
		const button = this.page.locator('.map-properties').getByText('Save selected', { exact: true });
		await expect(button).toBeVisible();
		await button.click();
	}

	async viewDetailsOfSavedFeature() {
		const button = this.page
			.locator('.map-status-saved')
			.getByText('View details', { exact: true });
		await expect(button).toBeVisible();
		await button.click();
		await this.page.waitForTimeout(this.ANIMATION_TIME);
	}

	async removeSavedFeature() {
		const button = this.page
			.locator('.map-properties')
			.getByText('Remove selection', { exact: true });
		await expect(button).toBeVisible();
		await button.click();
	}

	async closeProperties() {
		const button = this.page.locator('.map-properties .close-icon');
		await expect(button).toBeVisible();
		await button.click();
		await expect(this.page.locator('.map-properties')).not.toBeVisible();
	}

	async expectStatusBarFeatureSaved() {
		const titleLocator = this.page
			.locator('.map-status-bar-component')
			.filter({ has: this.page.locator(`.map-status span:text-is("Point saved")`) });
		await expect(titleLocator, `Map's status bar with wrong status: No point saved`).toBeVisible();
	}

	async expectStatusBarNotFeatureSaved() {
		const titleLocator = this.page
			.locator('.map-status-bar-component')
			.filter({ has: this.page.locator(`.map-status span:text-is("No point saved")`) });
		await expect(titleLocator, `Map's status bar with wrong status: Point saved`).toBeVisible();
	}

	async expectErrorMessage(expectedTitle: string, expectedMessage: string) {
		const error = this.page.locator('.map-block-error');
		await expect(error.locator('strong')).toHaveText(expectedTitle);
		await expect(error.locator('span')).toHaveText(expectedMessage);
	}

	async expectMapScreenshot(snapshotName: string, options = { maxDiffPixels: 100 }) {
		await this.page.waitForTimeout(this.ANIMATION_TIME);
		const containerLocator = this.page.locator(this.MAP_CONTAINER_SELECTOR);
		await expect(containerLocator).toHaveScreenshot(snapshotName, options);
	}

	async exitFullScreenSuccessfully() {
		await this.page.keyboard.press('Escape');
		await expect(this.page.locator('.map-full-screen')).not.toBeVisible();
	}
}
