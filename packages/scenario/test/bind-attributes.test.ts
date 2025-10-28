import {
	bind,
	body,
	head,
	html,
	input,
	mainInstance,
	model,
	t,
	title
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { beforeEach, describe, expect, it } from 'vitest';
import { Scenario } from '../src/jr/Scenario.ts';

describe('Bind to element attributes', () => {
	const formDefinition = html(
		head(
			title('Bind attributes'),
			model(
				mainInstance(
					t(
						'root id="bind-attributes"',
						t('version'),
						t('string-value version="xyzz"'),
					)
				),
				bind('/root/version').type('string'),
				bind('/root/string-value').type('string'),
				bind('/root/string-value/@version').type('string').calculate('/root/version').readonly('true()'),
			)
		),
		body(
			input('/root/version'),
			input('/root/string-value')
		)
	);

	let scenario: Scenario;

	beforeEach(async () => {
		scenario = await Scenario.init('Bind attributes', formDefinition);
	});

	describe('version is bound', () => {
		it('has a string runtime value', async () => {
			console.log('before answering');
			scenario.answer('/root/version', 'some version');
			scenario.answer('/root/string-value', 'val');
			// const payload = await scenario.prepareWebFormsInstancePayload();
			// console.log(payload.data[0]);
			// const instanceFile = payload.data[0].get(constants.INSTANCE_FILE_NAME);
			// console.log(instanceFile);
			// const instanceXML = await instanceFile.text();

			const submissionResult = await scenario.prepareWebFormsInstancePayload();

								const invalidSubmissionXML = t(`data id="prepare-for-submission"`,
						t('rep',
							t('inp', 'rep 1 inp')),
						t('rep',
							t('inp')),
						t('meta',
							t('instanceID', ''))
					).asXml();
			await expect(submissionResult).toHavePreparedSubmissionXML(invalidSubmissionXML);

			// expect(instanceXML).toBe(
			// 	t(
			// 		`data xmlns:orx="av" id="calculate-serde"`,
			// 		t('a', '2'),
			// 		t('b', '6'),
			// 		t('c', '40'),
			// 		t('orx:meta', t('orx:instanceID'))
			// 	).asXml()
			// );
			// console.log({ d: payload.data[0] });
		});
	});
});
