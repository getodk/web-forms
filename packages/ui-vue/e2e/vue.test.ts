import { faker } from '@faker-js/faker';
import { expect, test } from '@playwright/test';

test('All forms are rendered and there is no console error', async ({ page, browserName }) => {

	let consoleErrors = 0;

	page.on('console', msg => {
		if(msg.type() === 'error') {
			consoleErrors++;
		} 
	});

	await page.goto('/');

	const forms = await page.getByText('Show').all();

	for (const form of forms) {
		await form.click();

		// Traverse the form element by element
		// if focused element is an editable textbox then fill it
		// Exit the loop when focus is on the Send button
		// eslint-disable-next-line no-constant-condition
		while (true) {
			const onSendButton = await page.evaluate(() => {
				const activeElement = document.activeElement;
				return activeElement?.tagName === 'BUTTON' && activeElement.textContent === 'Send';
			});

			if (onSendButton) {
				break;
			}

			await page.keyboard.press(browserName == 'webkit' ? 'Alt+Tab' : 'Tab');

			const isEditableTextbox = await page.evaluate(() => {
				const activeElement = document.activeElement;
				return (
					activeElement?.tagName === 'INPUT' &&
					(activeElement as HTMLInputElement).type === 'text' &&
					!activeElement.hasAttribute('readonly')
				);
			});

			if (isEditableTextbox) {
				await page.keyboard.type(faker.internet.displayName());
			}
		}

		await page.getByText('Back').click();
	}

  // Assert that there's no console errors
	expect(consoleErrors).toBe(0);

});
