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
} from '@getodk/common/test/fixtures/xform-dsl';
import { beforeEach, describe, expect, it } from 'vitest';
import { BodyDefinition } from '../../src/parse/body/BodyDefinition.ts';
import { ModelDefinition } from '../../src/parse/model/ModelDefinition.ts';
import { XFormDefinition } from '../../src/parse/XFormDefinition.ts';
import { XFormDOM } from '../../src/parse/XFormDOM.ts';

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
						)
					),
					bind('/root/first-question').type('string'),
					bind('/root/second-question').type('string'),
					bind('/root/third-question').type('string'),
					bind('/root/meta/instanceID').type('string')
				)
			),
			body(
				input('/root/first-question', label('First question')),
				input('/root/second-question'),
				t('unknown-control ref="/root/third-question"')
			)
		);

		const xformDOM = XFormDOM.from(xform.asXml());

		xformDefinition = new XFormDefinition(xformDOM);
	});

	it('defines the form title', () => {
		expect(xformDefinition.title).toBe(FORM_TITLE);
	});

	it('defines the form id from the primary instance root', () => {
		expect(xformDefinition.id).toBe(PRIMARY_INSTANCE_ROOT_ID);
	});

	it("gets the form's model definition", () => {
		expect(xformDefinition.model).toBeInstanceOf(ModelDefinition);
	});

	it("gets the form's body definition", () => {
		expect(xformDefinition.body).toBeInstanceOf(BodyDefinition);
	});
});
