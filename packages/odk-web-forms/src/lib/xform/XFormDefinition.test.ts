import { beforeEach, describe, expect, it } from 'vitest';
import {
	bind,
	body,
	head,
	html,
	input,
	label,
	mainInstance,
	model,
	t,
	title,
} from '../../test/fixtures/xform-dsl';
import { XFormDefinition } from './XFormDefinition.ts';
import { XFormViewDefinition } from './XFormViewDefinition.ts';

describe('XFormDefinition', () => {
	const FORM_TITLE = 'Minimal XForm';
	const PRIMARY_INSTANCE_ROOT_ID = 'id-of-root';

	let xformDefinition: XFormDefinition;

	beforeEach(() => {
		const xform = html(
			head(
				title(FORM_TITLE),
				model(
					mainInstance(
						t(
							`root id="${PRIMARY_INSTANCE_ROOT_ID}"`,
							t('first-question'),
							t('second-question'),
							t('third-question'),
							t('meta', t('instanceID'))
						),
						bind('/root/first-question').type('string'),
						bind('/root/second-question').type('string'),
						bind('/root/third-question').type('string'),
						bind('/root/meta/instanceID').type('string')
					)
				)
			),
			body(
				input('/root/first-question', label('First question')),
				input('/root/second-question'),
				t('unknown-control ref="/root/third-question"')
			)
		);

		xformDefinition = new XFormDefinition(xform.asXMLDocument());
	});

	it('defines the form title', () => {
		expect(xformDefinition.title).toBe(FORM_TITLE);
	});

	it('defines the form id from the primary instance root', () => {
		expect(xformDefinition.id).toBe(PRIMARY_INSTANCE_ROOT_ID);
	});

	it("gets the form's view definition", () => {
		expect(xformDefinition.view).toBeInstanceOf(XFormViewDefinition);
	});
});
