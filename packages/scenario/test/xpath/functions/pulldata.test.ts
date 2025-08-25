import {
	bind,
	body,
	head,
	html,
	input,
	instance,
	mainInstance,
	model,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { stringAnswer } from '../../../src/answer/ExpectedStringAnswer.ts';
import { Scenario } from '../../../src/jr/Scenario.ts';

describe('ODK function support: `pulldata`', () => {

	it.each([
		{
			testName: 'returns match when there is one matching result',
			property: '@location',
			inputValue: 'north',
			expectedOutput: 'Alaska',
		},
		{
			testName: 'returns empty string when there are no matching results',
			property: '@location',
			inputValue: 'west',
			expectedOutput: '',
		},
		{
			testName: 'returns first match when there are multiple',
			property: '@location',
			inputValue: 'south',
			expectedOutput: 'Texas',
		},
		{
			testName: 'returns empty string when uses not existing property',
			property: '@doesnotexist',
			inputValue: '',
			expectedOutput: '',
		},
		{
			testName: 'returns empty string when uses not existing property with no value',
			property: '@doesnotexist',
			inputValue: '',
			expectedOutput: '',
		},
	])('$testName', async ({ property, inputValue, expectedOutput }) => {
		const scenario = await Scenario.init(
			'Some form',
			html(
				head(
					title('pulldata form'),
					model(
						mainInstance(
							t(
								'data id="pulldata"',
								t('my-location', inputValue),
								t('my-state')
							)
						),
						instance('states',
							t('item abbreviation="AK" location="north"', t('value', 'Alaska')),
							t('item abbreviation="TX" location="south"', t('value', 'Texas')),
							t('item abbreviation="HI" location="south"', t('value', 'Hawaii')),
							t('item abbreviation="WY"', t('value', 'Wyoming')),
						),
						bind('/data/my-state').type('string'),
						bind('/data/my-state')
							.type('string')
							.calculate(`pulldata('states', 'value', '${property}', '/data/my-location')`)
					)
				),
				body(input('/data/my-location'))
			)
		);

		expect(scenario.answerOf('/data/my-state')).toEqualAnswer(stringAnswer(expectedOutput));
	});

});
