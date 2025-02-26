import { faker } from '@faker-js/faker';
import { expect, Page, test } from '@playwright/test';
import { PreviewPage } from '../../page-objects/pages/PreviewPage.js';

const expandAllCategories = async (page: Page) => {
	await page.evaluate(() => {
		const collapsedDetails = document.querySelectorAll<HTMLDetailsElement>('details:not([open])');

		collapsedDetails.forEach((details) => {
			details.open = true;
		});
	});
};

test.describe('Preview Form Render', () => {
	test('demo forms load', async ({ context, page }) => {
		const previewPage = new PreviewPage(page);
		await previewPage.goToPage();

		const formPreviewLinks = await page.locator('.form-preview-link').all();

		expect(formPreviewLinks.length).toBeGreaterThan(0);

		for (const link of formPreviewLinks) {
			const [formPreviewPage] = await Promise.all([context.waitForEvent('page'), link.click()]);

			await formPreviewPage.waitForSelector(
				'.form-initialization-status.error, .form-initialization-status.ready',
				{
					state: 'attached',
				}
			);

			const [failureDialog] = await formPreviewPage.locator('.form-load-failure-dialog').all();

			expect(failureDialog).toBeUndefined();

			await formPreviewPage.close();
		}
	});

	test('all forms are rendered and there is no console error', async ({ page, browserName }) => {
		let consoleErrors = 0;
		page.on('console', (msg) => {
			if (msg.type() === 'error' || msg.type() === 'warning') {
				consoleErrors++;
			}
		});

		const previewPage = new PreviewPage(page);
		await previewPage.goToPage();

		// this ensures that Vue application is loaded before proceeding forward.
		await expect(page.getByText('Demo Forms')).toBeVisible();

		// Let's expand all categories, so that Form list is visible
		await expandAllCategories(page);

		const forms = await page.locator('ul.form-list li a').all();

		expect(forms.length).toBeGreaterThan(0);

		for (const form of forms) {
			await form.click();

			// Traverse the form element by element
			// if focused element is an editable textbox then fill it
			// Exit the loop when focus is on the Send button
			while (true) {
				const onSendButton = await page.evaluate(() => {
					const activeElement = document.activeElement;
					return activeElement?.tagName === 'BUTTON' && activeElement.textContent === 'Send';
				});

				if (onSendButton) {
					break;
				}

				await page.keyboard.press(browserName == 'webkit' ? 'Alt+Tab' : 'Tab');

				const inputType = await page.evaluate(() => {
					const isInputElement = (
						activeElement: Element | null
					): activeElement is HTMLInputElement => {
						return activeElement?.tagName === 'INPUT';
					};

					const activeElement = document.activeElement;

					if (
						!isInputElement(activeElement) ||
						activeElement.hasAttribute('readonly') ||
						activeElement.hasAttribute('disabled')
					) {
						return null;
					}

					return activeElement.type;
				});

				if (inputType === 'text') {
					await page.keyboard.type(faker.internet.displayName());
				}
				// Select the next option, if the last option is selected by default
				// then browser selects the first one.
				else if (inputType === 'radio') {
					await page.keyboard.press('ArrowDown');
				}
				// Tab behaviour for checkboxes is different, each Tab press moves the focus
				// to the next option. Here we are toggling every checkbox option.
				else if (inputType === 'checkbox') {
					// Toggle the option
					await page.keyboard.press('Space');
				}
			}

			const langChanger = page.locator('.larger-screens .language-changer');

			if ((await langChanger.count()) > 0) {
				await langChanger.click();
				await page.locator('.language-dd-label').last().click();
			}

			await page.goBack();
			await expandAllCategories(page);
		}

		expect(consoleErrors).toBe(0);
	});
});
