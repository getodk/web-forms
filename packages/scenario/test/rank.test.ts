import {
	body,
	head,
	html,
	instance,
	item,
	mainInstance,
	model,
	rank,
	selectDynamic,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, it, expect } from 'vitest';
import { Scenario } from '../src/jr/Scenario.ts';
import { r } from '../src/jr/resource/ResourcePathHelper.ts';

describe('Rank', () => {
	const getRankForm = () => {
		return html(
			head(
				title('Rank form'),
				model(
					mainInstance(t("data id='rank'", t('rankQuestion'))),

					instance(
						'options',
						item('option1', 'Option 1'),
						item('option2', 'Option 2'),
						item('option3', 'Option 3'),
						item('option4', 'Option 4')
					)
				)
			),
			body(
				rank(
					'/data/rankQuestion',
					"instance('options')/root/item"
				)
			)
		);
	};

	const getRankWithChoiceFilterForm = () => {
		return html(
			head(
				title('Rank with choice filter'),
				model(
					mainInstance(t("data id='rank'", t('rankQuestion'), t('selectQuestion'))),

					instance(
						'options',
						item('option1', 'Option 1'),
						item('option2', 'Option 2'),
						item('option3', 'Option 3'),
						item('option4', 'Option 4'),
						item('option5', 'Option 5')
					)
				)
			),
			body(
				selectDynamic(
					'/data/selectQuestion',
					"instance('options')/root/item"
				),

				rank(
					'/data/rankQuestion',
					"instance('options')/root/item[selected(/data/selectQuestion, value)]"
				)
			)
		);
	};

	it('should update value when rank has <items>', async () => {
		const RANK_QUESTION = '/data/rankWidget';
		const scenario = await Scenario.init(r('rank-form.xml'));

		expect(scenario.answerOf(RANK_QUESTION).getValue()).toBe('');

		scenario.answer(RANK_QUESTION, 'A', 'E', 'C', 'B', 'D', 'F', 'G');

		expect(scenario.answerOf(RANK_QUESTION).getValue()).toBe('A E C B D F G');
	});

	it('should update value when rank has <itemset>', async () => {
		const RANK_QUESTION = '/data/rankQuestion';
		const scenario = await Scenario.init('Rank form', getRankForm());

		expect(scenario.answerOf(RANK_QUESTION).getValue()).toBe('');

		scenario.answer(RANK_QUESTION, 'option1', 'option4', 'option2', 'option3');

		expect(scenario.answerOf(RANK_QUESTION).getValue()).toBe('option1 option4 option2 option3');
	});

	it('should filter values when rank has choice-filter and it should update values when options are ranked', async () => {
		const SELECT_QUESTION = '/data/selectQuestion';
		const RANK_QUESTION = '/data/rankQuestion';
		const scenario = await Scenario.init('Rank with choice filter', getRankWithChoiceFilterForm());

		expect(scenario.answerOf(SELECT_QUESTION).getValue()).toBe('');
		expect(scenario.answerOf(RANK_QUESTION).getValue()).toBe('');

		scenario.answer(SELECT_QUESTION, 'option1', 'option4', 'option3', 'option2');
		expect(scenario.answerOf(SELECT_QUESTION).getValue()).toBe('option1 option2 option3 option4');
		expect(scenario.answerOf(RANK_QUESTION).getValue()).toBe('');

		scenario.answer(RANK_QUESTION, 'option4', 'option1', 'option2', 'option3');
		expect(scenario.answerOf(RANK_QUESTION).getValue()).toBe('option4 option1 option2 option3');

		// Make rank not relevant
		scenario.answer(SELECT_QUESTION, '');
		expect(scenario.answerOf(SELECT_QUESTION).getValue()).toBe('');
		expect(scenario.answerOf(RANK_QUESTION).getValue()).toBe('');

		// Make rank relevant again
		scenario.answer(SELECT_QUESTION, 'option1', 'option5');
		expect(scenario.answerOf(SELECT_QUESTION).getValue()).toBe('option1 option5');
		expect(scenario.answerOf(RANK_QUESTION).getValue()).toBe('option1 option5');

		scenario.answer(RANK_QUESTION, 'option5', 'option1');
		expect(scenario.answerOf(RANK_QUESTION).getValue()).toBe('option5 option1');
	});
});
