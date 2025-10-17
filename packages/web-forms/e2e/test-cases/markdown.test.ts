import { expect, Locator, Page, test } from '@playwright/test';
import { FillFormPage } from '../page-objects/pages/FillFormPage.ts';
import { PreviewPage } from '../page-objects/pages/PreviewPage.ts';

async function selectMultiDropdownOption(page: Page, container: Locator, ...labels: string[]) {
	const dropdown = await container.locator('.multi-select-dropdown');
	await dropdown.click();
	for (const label of labels) {
		await page.locator(`.p-multiselect-option:has-text("${label}")`).click();
	}
};

async function selectDropdownOption(page: Page, container: Locator, label: string) {
	const dropdown = await container.locator('.dropdown');
	await dropdown.click();
	await page.locator(`.p-select-option:has-text("${label}")`).click();
};

/**
 * Tests the UI functionality of all question types in the "All Question Types" form,
 * including rendering, user input, and validation.
 */
test.describe('Markdown formatting', () => {

	let formPage: FillFormPage;

	test.beforeEach(async ({ page }) => {
		formPage = new FillFormPage(page);

		const previewPage = new PreviewPage(page);
		await previewPage.goToDevPage();
		await previewPage.openDevDemoForm('notes', '3-notes-with-markdown.xml', 'Notes');
	});

	test('renders markdown styling', async ({ page }) => {

		// output
		await formPage.input.fillAndExpectInputValue("What's your name?", '<span style="color:green">marty mcfly</span>', '<span style="color:green">marty mcfly</span>');
		const output = await page.locator('.question-container:has-text("You said:")');
		await expect(output).toHaveScreenshot('user-entered.png');

		const select1 = await page.locator('.question-container:has-text("Select options full")');
		await expect(select1).toHaveScreenshot('select-options.png');

		const dropdown1Container = await page.locator('.question-container:has-text("Select options minimal")');
		selectDropdownOption(page, dropdown1Container, 'yes');
		await expect(dropdown1Container).toHaveScreenshot('dropdown-options.png');

		const dropdownNContainer = await page.locator('.question-container:has-text("Select multiple minimal")');
		selectMultiDropdownOption(page, dropdownNContainer, 'yes', 'no');
		await expect(dropdownNContainer).toHaveScreenshot('dropdown-multiple-select.png');

		const note = await page.locator('.question-container:has-text("heading 1")');
		await expect(note).toHaveScreenshot('note.png');
		
	});

});
