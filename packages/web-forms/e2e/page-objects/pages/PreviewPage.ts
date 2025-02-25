import { expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

export class PreviewPage {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async goToPage() {
		await this.page.goto(BASE_URL);
	}

	/**
	 * Opens a preexisting demo form by navigating through the demo forms UI.
	 *
	 * @TODO Add support for uploading XML forms from /e2e/fixtures directory for test-specific scenarios
	 *
	 * @param {string} accordionName - The name of the demo forms category accordion
	 * @param {string} formLinkName - The exact name of the demo form link to open
	 * @param {string} formTitle - The expected title of the form, used to verify successful loading
	 * @returns {Promise<void>} Resolves when the form is successfully loaded and verified
	 */
	async openDemoForm(accordionName: string, formLinkName: string, formTitle: string) {
		const demoSection = this.page
			.locator('.dev-form-list-component')
			.getByText('Demo Forms for DEV');
		await demoSection.scrollIntoViewIfNeeded();
		await expect(demoSection).toBeVisible();

		const accordion = this.page.locator('.category-list').getByText(accordionName, { exact: true });
		await accordion.scrollIntoViewIfNeeded();
		await expect(accordion).toBeVisible();
		await accordion.click();

		const link = this.page.locator('.form-list').getByText(formLinkName, { exact: true });
		await link.scrollIntoViewIfNeeded();
		await expect(link).toBeVisible();
		await link.click();

		// Wait for form to load and verify the form title ensuring the form is ready.
		const title = this.page.locator('.form-title').getByRole('heading', { name: formTitle });
		await expect(title).toBeVisible();
	}
}
