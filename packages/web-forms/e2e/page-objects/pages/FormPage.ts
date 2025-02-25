import { expect, Page } from '@playwright/test';
import { GeopointControl } from '../controls/GeopointControl.js';

export class FormPage {
	private readonly page: Page;

	public readonly geopoint: GeopointControl;

	constructor(page: Page) {
		this.page = page;
		this.geopoint = new GeopointControl(page);
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
}
