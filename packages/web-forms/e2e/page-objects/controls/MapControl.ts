import { expect, Locator, Page } from '@playwright/test';

export class MapControl {
	private readonly MAP_COMPONENT_SELECTOR = '.map-block-component';
	private readonly MAP_CONTAINER_SELECTOR = '.map-container';
	private readonly MAP_SELECTOR = '.map-block';
	private readonly ANIMATION_TIME = 1000;

	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	getMapComponentLocator(label: string) {
		const question = this.page
			.locator('.question-container')
			.filter({ has: this.page.locator(`.control-text label span:text-is("${label}")`) });
		return question.locator(this.MAP_COMPONENT_SELECTOR);
	}

	async expectMapVisible(mapComponent: Locator) {
		const map = mapComponent.locator(this.MAP_SELECTOR);
		await expect(map, `Map not found`).toBeVisible();
		// Playwright's scrollIntoViewIfNeeded() scrolls minimally and doesn't guarantee to center
		// the element, so JavaScript scroll is used to ensure the map is centered and fully visible.
		const handle = await map.elementHandle();
		if (handle) {
			await handle.evaluate((el) => el.scrollIntoView({ block: 'center' }));
		}
	}

	async panMap(mapComponent: Locator, times = 1) {
		await mapComponent.scrollIntoViewIfNeeded();
		await this.page.mouse.move(600, 360);
		await this.page.mouse.down();
		await this.page.mouse.move(900, -500, { steps: times });
		await this.page.mouse.up();
		await this.page.waitForTimeout(this.ANIMATION_TIME);
		await this.page.waitForTimeout(this.ANIMATION_TIME);
	}

	async zoomIn(mapComponent: Locator, times = 1) {
		const button = mapComponent.locator('.ol-zoom').getByText('+', { exact: true });
		await expect(button).toBeVisible();
		for (let i = 0; i < times; i++) {
			await button.click();
			await this.page.waitForTimeout(this.ANIMATION_TIME);
		}
	}

	async zoomOut(mapComponent: Locator, times = 1) {
		const button = mapComponent.locator('.ol-zoom').getByText('–', { exact: true });
		await expect(button).toBeVisible();
		for (let i = 0; i < times; i++) {
			await button.click();
			await this.page.waitForTimeout(this.ANIMATION_TIME);
		}
	}

	async zoomToFitAll(mapComponent: Locator) {
		const button = mapComponent.locator('button[title="Zoom to fit all options"]');
		await expect(button).toBeVisible();
		await button.click();
		await this.page.waitForTimeout(this.ANIMATION_TIME);
	}

	async centerCurrentLocation(mapComponent: Locator) {
		const button = mapComponent.locator('button[title="Zoom to current location"]');
		await expect(button).toBeVisible();
		await button.click();
		await this.page.waitForTimeout(this.ANIMATION_TIME);
	}

	async toggleFullScreen(mapComponent: Locator) {
		const button = mapComponent.locator('button[title="Full Screen"]');
		await expect(button).toBeVisible();
		await button.click();
		await this.page.waitForTimeout(this.ANIMATION_TIME);
	}

	async expectFullScreenActive(mapComponent: Locator) {
		await expect(mapComponent).toHaveAttribute('class', expect.stringContaining('map-full-screen'));
	}

	async exitFullScreenSuccessfully(mapComponent: Locator) {
		await this.page.keyboard.press('Escape');
		await expect(mapComponent.locator('.map-full-screen')).not.toBeVisible();
	}

	/**
	 *	Selects feature on map
	 * @param positionX Relative to the left of the browser's viewport.
	 * @param positionY Relative to the top of the browser's viewport.
	 */
	async selectFeatureByClick(mapComponent: Locator, positionX: number, positionY: number) {
		await mapComponent.scrollIntoViewIfNeeded();
		await this.page.mouse.move(positionX, positionY);
		await this.page.mouse.down();
		await this.page.mouse.up();
		await this.page.waitForTimeout(this.ANIMATION_TIME);
	}

	async saveSelection(mapComponent: Locator) {
		const button = mapComponent
			.locator('.map-properties')
			.getByText('Save selected', { exact: true });
		await expect(button).toBeVisible();
		await button.click();
	}

	async removeSavedFeature(mapComponent: Locator) {
		const button = mapComponent
			.locator('.map-properties')
			.getByText('Remove selection', { exact: true });
		await expect(button).toBeVisible();
		await button.click();
	}

	async expectPropertiesVisible(mapComponent: Locator, title: string) {
		const titleLocator = mapComponent.locator(`.map-properties-header strong:text-is("${title}")`);
		await expect(titleLocator, `Map's properties for feature "${title}" not found`).toBeVisible();
	}

	async viewDetailsOfSavedFeature(mapComponent: Locator) {
		const button = mapComponent
			.locator('.map-status-saved')
			.getByText('View details', { exact: true });
		await expect(button).toBeVisible();
		await button.click();
		await this.page.waitForTimeout(this.ANIMATION_TIME);
	}

	async closeProperties(mapComponent: Locator) {
		const button = mapComponent.locator('.map-properties .close-icon');
		await expect(button).toBeVisible();
		await button.click();
		await expect(mapComponent.locator('.map-properties')).not.toBeVisible();
	}

	async expectStatusBarFeatureSaved(mapComponent: Locator) {
		const titleLocator = mapComponent.locator(`.map-status span:text-is("Point saved")`);
		await expect(titleLocator, `Map's status bar with wrong status: No point saved`).toBeVisible();
	}

	async expectStatusBarNotFeatureSaved(mapComponent: Locator) {
		const titleLocator = mapComponent.locator(`.map-status span:text-is("No point saved")`);
		await expect(titleLocator, `Map's status bar with wrong status: Point saved`).toBeVisible();
	}

	async expectErrorMessage(mapComponent: Locator, expectedTitle: string, expectedMessage: string) {
		const error = mapComponent.locator('.map-block-error');
		await expect(error.locator('strong')).toHaveText(expectedTitle);
		await expect(error.locator('span')).toHaveText(expectedMessage);
	}

	async expectMapScreenshot(
		mapComponent: Locator,
		snapshotName: string,
		options = { maxDiffPixels: 200 }
	) {
		await this.page.waitForTimeout(this.ANIMATION_TIME);
		await expect(mapComponent.locator(this.MAP_CONTAINER_SELECTOR)).toHaveScreenshot(
			snapshotName,
			options
		);
	}
}
