import { test } from '@playwright/test';
import { FormPage } from '../page-objects/pages/FormPage.ts';
import { PreviewPage } from '../page-objects/pages/PreviewPage.ts';

test.describe('Geopoint Question Type', () => {
	test.describe('Geolocation permission granted', () => {
		let formPage: FormPage;

		test.beforeEach(async ({ page, context }) => {
			await context.grantPermissions(['geolocation']);

			formPage = new FormPage(page);

			const previewPage = new PreviewPage(page);
			await previewPage.goToPage();
			await previewPage.openDemoForm('geopoint', 'geopoint.xml', 'Geopoint');
		});

		test('captures good-accuracy location', async ({ context }) => {
			await context.setGeolocation({
				latitude: 40.7128,
				longitude: -74.006,
				accuracy: 10,
				altitude: 0,
			});

			await formPage.expectLabel(`
        The browser will display a permission prompt to allow or block location access.
        Click 'Allow' to enable location services. If dismissed, the prompt may not appear
        again unless permissions are reset in browser settings.
      `);

			await formPage.expectLabel('Where are you filling out the survey?');
			await formPage.expectHint('(No autosave)');
			await formPage.geopoint.openDialog();
			await formPage.geopoint.expectGeopointDialog('Finding your location', '10m - Good accuracy');
			await formPage.geopoint.saveLocation();

			await formPage.geopoint.expectGeopointFormattedValue(
				['Accuracy: 10m', 'Latitude: 40.7128', 'Longitude: -74.006'],
				'Good accuracy'
			);
		});

		test('captures poor-accuracy location', async ({ context }) => {
			await context.setGeolocation({
				latitude: 80.5128,
				longitude: -99.9099,
				accuracy: 500,
				altitude: 0,
			});

			await formPage.expectLabel('Where are you filling out the survey?');
			await formPage.geopoint.openDialog();
			await formPage.geopoint.expectGeopointDialog('Finding your location', '500m - Poor accuracy');
			await formPage.geopoint.saveLocation();

			await formPage.geopoint.expectGeopointFormattedValue(
				['Accuracy: 500m', 'Latitude: 80.5128', 'Longitude: -99.9099'],
				'Poor accuracy'
			);
		});

		test('retries and improves location accuracy', async ({ context }) => {
			await context.setGeolocation({
				latitude: 79.5128,
				longitude: -95.9099,
				accuracy: 350,
				altitude: 0,
			});

			await formPage.geopoint.openDialog();
			await formPage.geopoint.expectGeopointDialog('Finding your location', '350m - Poor accuracy');
			await formPage.geopoint.saveLocation();

			await formPage.geopoint.expectGeopointFormattedValue(
				['Accuracy: 350m', 'Latitude: 79.5128', 'Longitude: -95.9099'],
				'Poor accuracy'
			);

			await context.setGeolocation({
				latitude: 80.5128,
				longitude: -99.9099,
				accuracy: 7,
				altitude: 1200,
			});

			await formPage.geopoint.retryCapture();
			await formPage.geopoint.expectGeopointDialog('Finding your location', '7m - Good accuracy');
			await formPage.geopoint.saveLocation();

			await formPage.geopoint.expectGeopointFormattedValue(
				['Accuracy: 7m', 'Latitude: 80.5128', 'Longitude: -99.9099'],
				'Good accuracy'
			);
		});
	});

	test.describe('Geolocation permission denied', () => {
		let formPage: FormPage;

		test.beforeEach(async ({ browser }) => {
			const context = await browser.newContext({
				permissions: [],
			});
			const page = await context.newPage();
			formPage = new FormPage(page);

			const previewPage = new PreviewPage(page);
			await previewPage.goToPage();
			await previewPage.openDemoForm('geopoint', 'geopoint.xml', 'Geopoint');
		});

		test('displays troubleshooting message when permission is denied', async () => {
			await formPage.expectLabel('Where are you filling out the survey?');
			await formPage.geopoint.openDialog();
			await formPage.geopoint.expectGeopointErrorMessage(
				'Cannot access location Grant location permission in the browser settings and make sure location is turned on.'
			);
		});
	});
});
