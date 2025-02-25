import { test } from '@playwright/test';
import { FormPage } from '../page-objects/form-page.ts';
import { PreviewPage } from '../page-objects/preview-page.ts';

test.describe('Geopoint Question Type', () => {
	test.describe('Geolocation permission granted', () => {
		let formPage: FormPage | undefined;

		test.beforeEach(async ({ page, context }) => {
			await context.grantPermissions(['geolocation']);

			formPage = new FormPage(page);

			const previewPage = new PreviewPage(page);
			await previewPage.goToPage();
			await previewPage.openDemoForm('geopoint', 'geopoint.xml', 'Geopoint');
		});

		test('should capture good accuracy location', async ({ context }) => {
			if (formPage == null) {
				throw new Error('FormPage not provided');
			}

			await context.setGeolocation({
				latitude: 40.7128,
				longitude: -74.006,
				accuracy: 10,
				altitude: 0,
			});

			await formPage.expectNote(
				'The browser will display a permission prompt to allow or block location' +
					// eslint-disable-next-line prettier-vue/prettier
					" access. Click 'Allow' to enable location services. If dismissed, the" +
					' prompt may not appear again unless permissions are reset in browser settings.'
			);

			await formPage.expectLabel('Where are you filling out the survey?');

			await formPage.openGeopoint();

			await formPage.expectGeopointDialog('Finding your location', '10m - Good accuracy');

			await formPage.saveGeopointLocation();

			await formPage.expectGeopointFormattedValue('Good accuracy', [
				'Accuracy: 10m',
				'Latitude: 40.7128',
				'Longitude: -74.006',
			]);
		});

		test('should capture poor accuracy location', async ({ context }) => {
			if (formPage == null) {
				throw new Error('FormPage not provided');
			}

			await context.setGeolocation({
				latitude: 80.5128,
				longitude: -99.9099,
				accuracy: 500,
				altitude: 0,
			});

			await formPage.expectNote(
				'The browser will display a permission prompt to allow or block location' +
					// eslint-disable-next-line prettier-vue/prettier
					" access. Click 'Allow' to enable location services. If dismissed, the" +
					' prompt may not appear again unless permissions are reset in browser settings.'
			);

			await formPage.expectLabel('Where are you filling out the survey?');

			await formPage.openGeopoint();

			await formPage.expectGeopointDialog('Finding your location', '500m - Poor accuracy');

			await formPage.saveGeopointLocation();

			await formPage.expectGeopointFormattedValue('Poor accuracy', [
				'Accuracy: 500m',
				'Latitude: 80.5128',
				'Longitude: -99.9099',
			]);
		});

		test('should retry to capture location', async ({ context }) => {
			if (formPage == null) {
				throw new Error('FormPage not provided');
			}

			await context.setGeolocation({
				latitude: 79.5128,
				longitude: -95.9099,
				accuracy: 350,
				altitude: 0,
			});

			await formPage.openGeopoint();

			await formPage.expectGeopointDialog('Finding your location', '350m - Poor accuracy');

			await formPage.saveGeopointLocation();

			await formPage.expectGeopointFormattedValue('Poor accuracy', [
				'Accuracy: 350m',
				'Latitude: 79.5128',
				'Longitude: -95.9099',
			]);

			await context.setGeolocation({
				latitude: 80.5128,
				longitude: -99.9099,
				accuracy: 7,
				altitude: 1200,
			});

			await formPage.retryGeopointLocation();

			await formPage.expectGeopointDialog('Finding your location', '7m - Good accuracy');

			await formPage.saveGeopointLocation();

			await formPage.expectGeopointFormattedValue('Good accuracy', [
				'Accuracy: 7m',
				'Latitude: 80.5128',
				'Longitude: -99.9099',
			]);
		});
	});

	test.describe('Geolocation permission denied', () => {
		let formPage: FormPage | undefined;

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

		test('should show troubleshooting message when permission is not granted', async () => {
			if (formPage == null) {
				throw new Error('FormPage not provided');
			}

			await formPage.expectNote(
				'The browser will display a permission prompt to allow or block location' +
					// eslint-disable-next-line prettier-vue/prettier
					" access. Click 'Allow' to enable location services. If dismissed, the" +
					' prompt may not appear again unless permissions are reset in browser settings.'
			);

			await formPage.expectLabel('Where are you filling out the survey?');

			await formPage.openGeopoint();

			await formPage.expectGeopointErrorMessage(
				'Cannot access location Grant location permission in the browser settings and make sure location is turned on.'
			);
		});
	});
});
