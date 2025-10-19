import { expect, test } from '@playwright/test';
import { FillFormPage } from '../page-objects/pages/FillFormPage.ts';
import { PreviewPage } from '../page-objects/pages/PreviewPage.ts';

test.describe('Markdown formatting', () => {
	let formPage: FillFormPage;

	test.beforeEach(async ({ page }) => {
		formPage = new FillFormPage(page);

		const previewPage = new PreviewPage(page);
		await previewPage.goToDevPage();
		await previewPage.openDevDemoForm('notes', '3-notes-with-markdown.xml', 'Notes');
	});

	test('renders markdown styling', async ({ page }) => {
		await formPage.input.fillAndExpectInputValue(
			"What's your name?",
			'<span style="color:green">marty mcfly</span>',
			'<span style="color:green">marty mcfly</span>'
		);
		await formPage.text.expectScreenshot(
			'.question-container:has-text("You said:")',
			'user-entered.png',
			{
				maxDiffPixelRatio: 0.02,
			}
		);

		await formPage.text.expectScreenshot(
			'.question-container:has-text("Select options full")',
			'select-options.png',
			{
				maxDiffPixelRatio: 0.02,
			}
		);

		const dropdown1Container = page.locator(
			'.question-container:has-text("Select options minimal")'
		);
		await formPage.select.selectDropdownOption(dropdown1Container, 'yes');
		await expect(dropdown1Container).toHaveScreenshot('dropdown-options.png', {
			maxDiffPixelRatio: 0.02,
		});

		const dropdownNContainer = page.locator(
			'.question-container:has-text("Select multiple minimal")'
		);
		await formPage.select.selectMultiDropdownOption(dropdownNContainer, 'yes', 'no');

		await expect(dropdownNContainer).toHaveScreenshot('dropdown-multiple-select.png', {
			maxDiffPixelRatio: 0.02,
		});

		await formPage.text.expectScreenshot(
			'.question-container:has-text("heading 1") .note-control',
			'note.png',
			{
				maxDiffPixelRatio: 0.05,
			}
		);
	});
});
