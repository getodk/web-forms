import { Locator, test } from '@playwright/test';
import { BrowserContext } from 'playwright-core';
import { FillFormPage } from '../../page-objects/pages/FillFormPage.ts';
import { PreviewPage } from '../../page-objects/pages/PreviewPage.ts';

test.describe('All Question Types (Visual)', () => {
	let formPage: FillFormPage;
	let context: BrowserContext;

	/**
	 * Opens the form once and runs all test cases to optimize suite execution speed.
	 */
	test.beforeAll(async ({ browser }) => {
		const permissions = ['geolocation'];
		if (browser.browserType().name() === 'chromium') {
			permissions.push('clipboard-write');
		}

		context = await browser.newContext({
			geolocation: { latitude: -28.996, longitude: 134.762 }, // South Australia,
			permissions: permissions,
		});
		const page = await context.newPage();
		const previewPage = new PreviewPage(page);
		await previewPage.goToDevPage();

		const newPage = await previewPage.openPublicDemoForm(
			'All question types',
			'All question types'
		);
		formPage = new FillFormPage(newPage);
	});

	test.afterAll(async () => {
		await context?.close();
	});

	/**
	 * This is a slow suite; it waits for map animations and rendering to finish.
	 * If additional tests are included, we might run them only on one browser, on merge, or on request.
	 */
	test.describe('Select one from map', () => {
		let mapComponent: Locator;

		test.beforeAll(async () => {
			await formPage.waitForNetworkIdle();
			await formPage.text.expectHint(
				'select_one type with map appearance. Choices are loaded from a GeoJSON attachment'
			);
			mapComponent = formPage.map.getMapComponentLocator('Map');
		});

		test.beforeEach(async () => {
			await formPage.waitForNetworkIdle();
			await formPage.map.expectMapVisible(mapComponent);
			await formPage.map.scrollMapIntoView(mapComponent);
		});

		test('renders map, selects feature, and saves selection', async () => {
			await formPage.map.expectMapScreenshot(mapComponent, 'select-map-initial-state.png');

			await formPage.map.selectFeature(700, 222);
			await formPage.map.expectMapScreenshot(mapComponent, 'select-map-point-selected.png');

			await formPage.map.saveSelection(mapComponent);
			await formPage.map.expectMapScreenshot(mapComponent, 'select-map-point-saved.png');
			await formPage.map.closeProperties(mapComponent);
		});

		test('toggles full screen and verifies more surface map is visible', async () => {
			await formPage.map.toggleFullScreen(mapComponent);
			await formPage.map.expectFullScreenActive(mapComponent);
			await formPage.map.expectMapScreenshot(mapComponent, 'select-map-full-screen.png', true);
			await formPage.map.exitFullScreen(mapComponent);
		});

		test('zooms in and out, pans the map and zooms to fit all features', async () => {
			await formPage.map.zoomOut(mapComponent, 2);
			await formPage.map.expectMapScreenshot(mapComponent, 'select-map-zoom-out.png');
			await formPage.map.zoomIn(mapComponent, 3);
			await formPage.map.expectMapScreenshot(mapComponent, 'select-map-zoom-in.png');
			await formPage.map.panMap(mapComponent, 300, -200);
			await formPage.map.expectMapScreenshot(mapComponent, 'select-map-panning.png');
			await formPage.map.zoomToFitAll(mapComponent);
			await formPage.map.expectMapScreenshot(
				mapComponent,
				'select-map-zoom-to-fit-all-features.png'
			);
		});

		test('opens details of saved feature and remove saved feature', async () => {
			await formPage.map.viewDetailsOfSavedFeature(mapComponent);
			await formPage.map.expectMapScreenshot(mapComponent, 'select-map-view-details.png');
			await formPage.map.removeSavedFeature(mapComponent);
			await formPage.map.expectMapScreenshot(mapComponent, 'select-map-removed-saved-feature.png');
			await formPage.map.closeProperties(mapComponent);
		});

		test('zooms to current location', async () => {
			await formPage.waitForNetworkIdle();
			await formPage.map.scrollMapIntoView(mapComponent);
			await formPage.map.centerCurrentLocation(mapComponent);
			await formPage.map.expectMapScreenshot(mapComponent, 'select-map-zoom-current-location.png');
		});
	});
});

test.describe('All Question Types - Geolocation permission denied', () => {
	let formPage: FillFormPage;
	let context: BrowserContext;

	test.beforeAll(async ({ browser }) => {
		context = await browser.newContext({
			permissions: [],
		});

		const page = await context.newPage();
		const previewPage = new PreviewPage(page);
		await previewPage.goToDevPage();

		const newPage = await previewPage.openPublicDemoForm(
			'All question types',
			'All question types'
		);
		formPage = new FillFormPage(newPage);
		await formPage.waitForNetworkIdle();
	});

	test.afterAll(async () => {
		await context?.close();
	});

	test('select from map displays error when zooming to current location', async () => {
		const mapComponent = formPage.map.getMapComponentLocator('Map');
		await formPage.map.scrollMapIntoView(mapComponent);
		await formPage.map.centerCurrentLocation(mapComponent);
		await formPage.map.expectErrorMessage(
			mapComponent,
			'Cannot access location',
			'Grant location permission in the browser settings and make sure location is turned on.'
		);
	});
});
