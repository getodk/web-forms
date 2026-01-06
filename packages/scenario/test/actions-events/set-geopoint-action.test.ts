import {
	bind,
	body,
	group,
	head,
	html,
	input,
	mainInstance,
	model,
	repeat,
	setgeopoint,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { stringAnswer } from '../../src/answer/ExpectedStringAnswer.ts';
import { Scenario } from '../../src/jr/Scenario.ts';

describe('odk:setgeopoint action', () => {
	const geolocationProvider = {
		geolocationProvider: {
			getLocation: () => Promise.resolve('38.295 21.7567 110 5'),
		},
	};

	it('should not set invalid point when coordinates are wrong', async () => {
		const scenario = await Scenario.init(
			'Invalid coords',
			html(
				head(
					title('Invalid coords'),
					model(
						mainInstance(t('data id="invalid-coords"', t('source'), t('destination'))),
						bind('/data/destination').type('string')
					)
				),
				body(input('/data/source'), setgeopoint('odk-instance-first-load', '/data/destination'))
			),
			{ geolocationProvider: { getLocation: () => Promise.resolve('300 21.7567 110 5') } }
		);

		expect(scenario.answerOf('/data/destination').getValue()).toBe('');
	});

	it('should not set invalid point when incorrect text provided', async () => {
		const scenario = await Scenario.init(
			'Invalid text',
			html(
				head(
					title('Invalid text'),
					model(
						mainInstance(t('data id="invalid-text"', t('source'), t('destination'))),
						bind('/data/destination').type('string')
					)
				),
				body(input('/data/source'), setgeopoint('odk-instance-first-load', '/data/destination'))
			),
			{ geolocationProvider: { getLocation: () => Promise.resolve('abcd') } }
		);

		expect(scenario.answerOf('/data/destination').getValue()).toBe('');
	});

	it('should not set point when incorrect event provided', async () => {
		const scenario = await Scenario.init(
			'Invalid event',
			html(
				head(
					title('Invalid event'),
					model(
						mainInstance(t('data id="invalid-event"', t('source'), t('destination'))),
						bind('/data/destination').type('string')
					)
				),
				body(input('/data/source'), setgeopoint('odk-some-random-event', '/data/destination'))
			),
			geolocationProvider
		);

		expect(scenario.answerOf('/data/destination').getValue()).toBe('');
	});

	it('set point when event is odk-instance-first-load', async () => {
		const scenario = await Scenario.init(
			'On first load',
			html(
				head(
					title('On first load'),
					model(
						mainInstance(t('data id="first-load"', t('destination'))),
						bind('/data/destination').readonly('1').type('string'),
						setgeopoint('odk-instance-first-load', '/data/destination')
					)
				),
				body(input('/data/destination'))
			),
			geolocationProvider
		);

		expect(scenario.answerOf('/data/destination')).toEqualAnswer(
			stringAnswer('38.295 21.7567 110 5')
		);
	});

	it('set point when event is odk-instance-load', async () => {
		const scenario = await Scenario.init(
			'On instance load',
			html(
				head(
					title('On instance load'),
					model(
						mainInstance(t('data id="instance-load"', t('house_location'))),
						bind('/data/house_location').readonly('1').type('string'),
						setgeopoint('odk-instance-load', '/data/house_location')
					)
				),
				body(input('/data/house_location'))
			),
			geolocationProvider
		);

		expect(scenario.answerOf('/data/house_location')).toEqualAnswer(
			stringAnswer('38.295 21.7567 110 5')
		);
	});

	it('set point when event is odk-new-repeat', async () => {
		const scenario = await Scenario.init(
			'On new repeat',
			html(
				head(
					title('On new repeat'),
					model(
						mainInstance(t('data id="some-form"', t('person jr:template=""', t('location')))),
						bind('/data/person/location').type('string').readonly()
					)
				),
				body(
					group(
						'/data/person',
						repeat(
							'/data/person',
							input('/data/person/location'),
							setgeopoint('odk-new-repeat', '/data/person/location')
						)
					)
				)
			),
			geolocationProvider
		);

		scenario.createNewRepeat('/data/person');
		await flushPromises();
		expect(scenario.answerOf('/data/person[1]/location')).toEqualAnswer(
			stringAnswer('38.295 21.7567 110 5')
		);

		scenario.createNewRepeat('/data/person');
		await flushPromises();
		expect(scenario.answerOf('/data/person[2]/location')).toEqualAnswer(
			stringAnswer('38.295 21.7567 110 5')
		);
	});

	it('set point when event is xforms-value-changed', async () => {
		const scenario = await Scenario.init(
			'On value change',
			html(
				head(
					title('On value change'),
					model(
						mainInstance(t('data id="on-value-change"', t('source'), t('destination'))),
						bind('/data/source').type('int'),
						bind('/data/destination').type('string')
					)
				),
				body(input('/data/source', setgeopoint('xforms-value-changed', '/data/destination')))
			),
			geolocationProvider
		);

		scenario.answer('/data/source', 22);
		expect(scenario.answerOf('/data/destination')).toEqualAnswer(
			stringAnswer('38.295 21.7567 110 5')
		);
	});
});
