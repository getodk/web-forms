import { expect, Page } from '@playwright/test';

export class FormPage {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async expectNote(expectedNoteText: string) {
		const note = this.page.locator('.note-control').getByText(expectedNoteText, { exact: true });
		await note.scrollIntoViewIfNeeded();
		await expect(note).toBeVisible();
	}

	async expectLabel(expectedLabelText: string) {
		const note = this.page.locator('.control-text').getByText(expectedLabelText, { exact: true });
		await note.scrollIntoViewIfNeeded();
		await expect(note).toBeVisible();
	}

	async clickButton(parentLocator: string, buttonText: string, index = 0) {
		const buttons = this.page.locator(parentLocator).getByText(buttonText, { exact: true });
		const button = buttons.nth(index);
		await button.scrollIntoViewIfNeeded();
		await expect(button).toBeVisible();
		await button.click();
	}

	openGeopoint() {
		return this.clickButton('.geopoint-control', 'Get location');
	}

	saveGeopointLocation() {
		return this.clickButton('.geo-dialog-footer', 'Save location');
	}

	retryGeopointLocation() {
		return this.clickButton('.geopoint-value', 'Try again');
	}

	async expectGeopointDialog(expectedTitle: string, expectedQualityText: string) {
		const dialogTitle = this.page
			.locator('.geo-dialog-header-title')
			.getByText(expectedTitle, { exact: true });
		await expect(dialogTitle).toBeVisible();

		const accuracyQuality = this.page
			.locator('.geopoint-information .geo-quality')
			.getByText(expectedQualityText, { exact: true });
		await expect(accuracyQuality).toBeVisible();
	}

	async expectGeopointFormattedValue(expectedQuality: string, expectedLocation: string[]) {
		const valueContainer = this.page.locator('.geopoint-value');

		const quality = valueContainer
			.locator('.geo-quality')
			.getByText(expectedQuality, { exact: true });
		await expect(quality).toBeVisible();

		for (const location of expectedLocation) {
			const formattedValue = valueContainer
				.locator('.geopoint-formatted-value')
				.getByText(location, { exact: true });
			await expect(formattedValue).toBeVisible();
		}
	}

	async expectGeopointErrorMessage(expectedMessage: string[]) {
		const message = this.page
			.locator('.geopoint-error')
			.getByText(expectedMessage, { exact: true });
		await expect(message).toBeVisible();
	}
}
