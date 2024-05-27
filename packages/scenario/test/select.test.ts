import {
	bind,
	body,
	head,
	html,
	input,
	instance,
	item,
	label,
	mainInstance,
	model,
	repeat,
	select1,
	select1Dynamic,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { beforeEach, describe, expect, it } from 'vitest';
import { answerText } from '../src/answer/ExpectedDisplayTextAnswer.ts';
import { choice } from '../src/choice/ExpectedChoice.ts';
import { Scenario } from '../src/jr/Scenario.ts';
import { setUpSimpleReferenceManager } from '../src/jr/reference/ReferenceManagerTestUtils.ts';
import { r } from '../src/jr/resource/ResourcePathHelper.ts';
import { nullValue } from '../src/value/ExpectedNullValue.ts';

// Ported as of https://github.com/getodk/javarosa/commit/5ae68946c47419b83e7d28290132d846e457eea6
describe('DynamicSelectUpdateTest.java', () => {
	/**
	 * @todo - per Slack discussion, we will update JavaRosa's corresponding tests
	 * to use absolute paths in body references. For now, we run the affected tests
	 * against the fixture as it currently exists in JR, and then against the same
	 * fixture with absolute paths substituted in place of their relative
	 * counterparts (i.e. {@link substituteAbsoluteBodyReferences}: `true`).
	 *
	 * @see
	 * {@link https://github.com/getodk/javarosa/pull/759/commits/c72b80bf1c5044745cadd573ef87f46255f25df0}
	 */
	interface GetSelectFromRepeatFormOptions {
		readonly substituteAbsoluteBodyReferences: boolean;
	}

	describe.each<GetSelectFromRepeatFormOptions>([
		{ substituteAbsoluteBodyReferences: false },
		{ substituteAbsoluteBodyReferences: true },
	])(
		'substituting absolute body references: $substituteAbsoluteBodyReferences',
		({ substituteAbsoluteBodyReferences }) => {
			// // TODO: didn't need this for the first test, but it's here in case there
			// // are subsequent tests which would use it. REMOVE THIS if it isn't used in
			// // any tests submitted in the bulk test port PR.
			// const relativeBodyRefTest = {
			// 	/**
			// 	 * Use for tests which fail **because** the form fixture uses relative
			// 	 * body references.
			// 	 */
			// 	it: substituteAbsoluteBodyReferences ? it : it.fails,
			// } as const;

			const getSelectFromRepeatForm = (predicate = '') => {
				const repeatValueInputRef = substituteAbsoluteBodyReferences
					? '/data/repeat/value'
					: 'value';
				const repeatLabelInputRef = substituteAbsoluteBodyReferences
					? '/data/repeat/label'
					: 'label';
				const filterInputRef = substituteAbsoluteBodyReferences ? '/data/filter' : 'filter';

				return html(
					head(
						title('Select from repeat'),
						model(
							mainInstance(
								t(
									"data id='repeat-select'",
									t('repeat', t('value'), t('label')),
									t('filter'),
									t('select')
								)
							)
						)
					),
					body(
						repeat('/data/repeat', input(repeatValueInputRef), input(repeatLabelInputRef)),
						input(filterInputRef),
						select1Dynamic('/data/select', '../repeat' + (predicate !== '' ? `[${predicate}]` : ''))
					)
				);
			};

			/**
			 * Integration tests to verify that the choice lists for "dynamic selects"
			 * (selects with itemsets rather than inline items) are updated when
			 * dependent values change.
			 *
			 * See also:
			 * - {@see SelectOneChoiceFilterTest}
			 * - {@see SelectMultipleChoiceFilterTest} for coverage of dynamic select
			 *   multiples
			 * - {@see XPathFuncExprRandomizeTest} for coverage of choice list updates
			 *   when randomization is specified
			 *
			 * **PORTING NOTES**
			 *
			 * 1. The above reference to `XPathFuncExprRandomizeTest` doesn't resolve to
			 *    anything here, but it evidently doesn't resolve to anything in
			 *    JavaRosa (anymore?) either.
			 *
			 * 2. Despite accommodating relative body `ref` attributes, this test still
			 *    fails. A brief side quest to investigate the nature of the failure
			 *    revealed that:
			 *
			 *    - Even without supporting relative `ref`s on controls, we'll need to
			 *      do so for `<itemset>` and its `<value>` child (presumably its
			 *      `<label>` child as well). The concern is so general we probably
			 *      might as well actually just support them all.
			 *
			 *    - Even resolving **all** of these relative references, the reactive
			 *      subscriptions don't propagate updates until after a new repeat
			 *      instance is added. A similar (but differently presenting) bug was
			 *      observed in @sadiqkhoja's demo earlier today. Both (for different
			 *      reasons) _at least partially_ implicate the need to resolve multiple
			 *      nodes in `getSubscribableDependencyByReference` (or whatever may
			 *      evolve in its place/to support its current use cases).
			 */
			describe('select from repeat', () => {
				describe('when repeat added', () => {
					// Unlike static secondary instances, repeats are dynamic. Repeat instances (items) can be added or removed. The
					// contents of those instances (item values, labels) can also change.
					it.fails('updates choices', async () => {
						const scenario = await Scenario.init('Select from repeat', getSelectFromRepeatForm());

						scenario.answer('/data/repeat[1]/value', 'a');
						scenario.answer('/data/repeat[1]/label', 'A');
						expect(scenario.choicesOf('/data/select')).toContainChoices([choice('a', 'A')]);

						scenario.answer('/data/repeat[2]/value', 'b');
						scenario.answer('/data/repeat[2]/label', 'B');
						expect(scenario.choicesOf('/data/select')).toContainChoicesInAnyOrder([
							choice('a', 'A'),
							choice('b', 'B'),
						]);
					});
				});

				describe('when repeat changed', () => {
					it.fails('updates choices', async () => {
						const scenario = await Scenario.init('Select from repeat', getSelectFromRepeatForm());

						scenario.answer('/data/repeat[1]/value', 'a');
						scenario.answer('/data/repeat[1]/label', 'A');

						expect(scenario.choicesOf('/data/select')).toContainChoices([choice('a', 'A')]);

						scenario.answer('/data/repeat[1]/value', 'c');
						scenario.answer('/data/repeat[1]/label', 'C');

						expect(scenario.choicesOf('/data/select')).toContainChoices([choice('c', 'C')]);
						expect(scenario.choicesOf('/data/select').size()).toBe(1);
					});
				});

				describe('when repeat removed', () => {
					it.fails('updates choices', async () => {
						const scenario = await Scenario.init('Select from repeat', getSelectFromRepeatForm());

						scenario.answer('/data/repeat[1]/value', 'a');
						scenario.answer('/data/repeat[1]/label', 'A');

						expect(scenario.choicesOf('/data/select')).toContainChoices([choice('a', 'A')]);

						scenario.removeRepeat('/data/repeat[1]');

						expect(scenario.choicesOf('/data/select').size()).toBe(0);
					});
				});

				describe('with predicate', () => {
					describe('when predicate trigger changes', () => {
						it.fails('updates choices', async () => {
							const scenario = await Scenario.init(
								'Select from repeat',
								getSelectFromRepeatForm('starts-with(value,current()/../filter)')
							);

							scenario.answer('/data/repeat[1]/value', 'a');
							scenario.answer('/data/repeat[1]/label', 'A');
							scenario.answer('/data/filter', 'a');

							expect(scenario.choicesOf('/data/select')).toContainChoices([choice('a', 'A')]);

							scenario.answer('/data/filter', 'b');

							expect(scenario.choicesOf('/data/select').size()).toBe(0);
						});
					});
				});
			});
		}
	);

	/**
	 * **PORTING NOTES**
	 *
	 * 1. JavaRosa's name for this test (`multilanguage`) has been replaced with a
	 *    more idiomatic (BDD-ish) name suitable for a call to `it`.
	 *
	 * 2. The JavaRosa test implementation specifies itext ids for label text. Per
	 *    discussion in Slack, we've updated the test to assert the expected label
	 *    translation strings. The itext ids from the original test are currently
	 *    preserved as inline comments.
	 */
	it('translates select choice labels', async () => {
		const scenario = await Scenario.init(
			'Multilingual dynamic select',
			html(
				head(
					title('Multilingual dynamic select'),
					model(
						t(
							'itext',
							t(
								"translation lang='fr'",
								t("text id='choices-0'", t('value', 'A (fr)')),
								t("text id='choices-1'", t('value', 'B (fr)')),
								t("text id='choices-2'", t('value', 'C (fr)'))
							),
							t(
								"translation lang='en'",
								t("text id='choices-0'", t('value', 'A (en)')),
								t("text id='choices-1'", t('value', 'B (en)')),
								t("text id='choices-2'", t('value', 'C (en)'))
							)
						),
						mainInstance(t("data id='multilingual-select'", t('select'))),

						instance(
							'choices',
							t('item', t('itextId', 'choices-0'), t('name', 'a')),
							t('item', t('itextId', 'choices-1'), t('name', 'b')),
							t('item', t('itextId', 'choices-2'), t('name', 'c'))
						)
					)
				),
				body(
					select1Dynamic(
						'/data/select',
						"instance('choices')/root/item",
						'name',
						'jr:itext(itextId)'
					)
				)
			)
		);

		scenario.setLanguage('en');

		expect(scenario.choicesOf('/data/select').size()).toBe(3);

		expect(scenario.choicesOf('/data/select')).toContainChoicesInAnyOrder([
			choice('a', /* choices-0 */ 'A (en)'),
			choice('b', /* choices-1 */ 'B (en)'),
			choice('c', /* choices-2 */ 'C (en)'),
		]);
	});

	describe('Select with changed triggers', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * The last assertion is a reference check, which will always return true in
		 * our {@link Scenario} implementation! This seems to be intended to
		 * exercise an implementation detail to validate recomputation.
		 *
		 * An alternate implementation of the same test follows, exercising **two
		 * recomputations:**
		 *
		 * 1. Applying a different filter, to assert recomputation by checking that
		 *    the available choices changed.
		 *
		 * 2. Restoring the original fitler, to assert recomputation does restore
		 *    the originally available choices. (This is still testing a slightly
		 *    different case than the original JavaRosa test, but seems both worth
		 *    testing and a bit closer to the original test's intent).
		 */
		it('recomputes [the] choice list', async () => {
			const scenario = await Scenario.init(
				'Select',
				html(
					head(
						title('Select'),
						model(
							mainInstance(t("data id='select'", t('filter'), t('select'))),

							instance(
								'choices',
								item('aa', 'A'),
								item('aaa', 'AA'),
								item('bb', 'B'),
								item('bbb', 'BB')
							)
						)
					),
					body(
						input('/data/filter'),
						select1Dynamic(
							'/data/select',
							"instance('choices')/root/item[starts-with(value,/data/filter)]"
						)
					)
				)
			);

			scenario.answer('/data/filter', 'a');

			const choices = scenario.choicesOf('/data/select');

			expect(choices).toContainChoicesInAnyOrder([choice('aa', 'A'), choice('aaa', 'AA')]);

			scenario.answer('/data/filter', 'aa');

			expect(choices).toContainChoicesInAnyOrder([choice('aa', 'A'), choice('aaa', 'AA')]);

			// Even though the list happens to be unchanged, it should have been recomputed because the trigger value changed
			expect(scenario.choicesOf('/data/select')).not.toBe(choices);
		});

		it('recomputes the choice list (alt)', async () => {
			const scenario = await Scenario.init(
				'Select',
				html(
					head(
						title('Select'),
						model(
							mainInstance(t("data id='select'", t('filter'), t('select'))),

							instance(
								'choices',
								item('aa', 'A'),
								item('aaa', 'AA'),
								item('bb', 'B'),
								item('bbb', 'BB')
							)
						)
					),
					body(
						input('/data/filter'),
						select1Dynamic(
							'/data/select',
							"instance('choices')/root/item[starts-with(value,/data/filter)]"
						)
					)
				)
			);

			scenario.answer('/data/filter', 'a');

			let choices = scenario.choicesOf('/data/select');

			expect(choices).toContainChoicesInAnyOrder([choice('aa', 'A'), choice('aaa', 'AA')]);

			expect(choices).not.toContainChoicesInAnyOrder([choice('bb', 'B'), choice('bbb', 'BB')]);

			scenario.answer('/data/filter', 'b');

			choices = scenario.choicesOf('/data/select');

			expect(choices).not.toContainChoicesInAnyOrder([choice('aa', 'A'), choice('aaa', 'AA')]);

			expect(choices).toContainChoicesInAnyOrder([choice('bb', 'B'), choice('bbb', 'BB')]);

			scenario.answer('/data/filter', 'a');

			choices = scenario.choicesOf('/data/select');

			expect(choices).toContainChoicesInAnyOrder([choice('aa', 'A'), choice('aaa', 'AA')]);

			expect(choices).not.toContainChoicesInAnyOrder([choice('bb', 'B'), choice('bbb', 'BB')]);
		});
	});

	/**
	 * **PORTING NOTES**
	 *
	 * This currently fails because repeat-based itemsets are broken more
	 * generally. As with the above sub-suite, the last assertion is a reference
	 * check and will always pass. Once repeat-based itemsets are fixed, we'll
	 * want to consider whether this test should be implemented differently too.
	 */
	describe('select with repeat as trigger', () => {
		it.fails('recomputes [the] choice list at every request', async () => {
			const scenario = await Scenario.init(
				'Select with repeat trigger',
				html(
					head(
						title('Repeat trigger'),
						model(
							mainInstance(t("data id='repeat-trigger'", t('repeat', t('question')), t('select'))),

							instance('choices', item('1', 'A'), item('2', 'AA'), item('3', 'B'), item('4', 'BB'))
						)
					),
					body(
						repeat('/data/repeat', input('/data/repeat/question')),
						select1Dynamic(
							'/data/select',
							"instance('choices')/root/item[value>count(/data/repeat)]"
						)
					)
				)
			);

			scenario.answer('/data/repeat[1]/question', 'a');

			expect(scenario.choicesOf('/data/select').size()).toBe(3);

			scenario.answer('/data/repeat[2]/question', 'b');

			const choices = scenario.choicesOf('/data/select');

			expect(choices.size()).toBe(2);

			// Because of the repeat trigger in the count expression, choices should be recomputed every time they're requested
			expect(scenario.choicesOf('/data/select')).not.toBe(choices);
		});
	});

	//region Caching for selects in repeat
	// When a dynamic select is in a repeat, the itemsets for all repeat instances are represented by the same ItemsetBinding.
	describe('select in repeat', () => {
		describe('with ref to repeat child in predicate', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * This test again asserts a reference check. It seems likely that the
			 * test is otherwise valid without that check.
			 *
			 * Once again, the current failure is likely related to repeat-based
			 * itemsets being broken in general.
			 */
			it.fails('evaluates [the] choice list for each repeat instance', async () => {
				const scenario = await Scenario.init(
					'Select in repeat',
					html(
						head(
							title('Select in repeat'),
							model(
								mainInstance(t("data id='repeat-select'", t('repeat', t('filter'), t('select')))),

								instance(
									'choices',
									item('a', 'A'),
									item('aa', 'AA'),
									item('b', 'B'),
									item('bb', 'BB')
								)
							)
						),
						body(
							repeat(
								'/data/repeat',
								input('filter'),
								select1Dynamic(
									'/data/repeat/select',
									"instance('choices')/root/item[starts-with(value,current()/../filter)]"
								)
							)
						)
					)
				);

				scenario.answer('/data/repeat[1]/filter', 'a');
				scenario.answer('/data/repeat[2]/filter', 'a');

				const repeat0Choices = scenario.choicesOf('/data/repeat[1]/select');
				const repeat1Choices = scenario.choicesOf('/data/repeat[2]/select');

				// The trigger keys are /data/repeat[1]/filter and /data/repeat[2]/filter which means no caching between them
				expect(repeat0Choices).not.toBe(repeat1Choices);

				scenario.answer('/data/repeat[2]/filter', 'bb');

				expect(scenario.choicesOf('/data/repeat[1]/select').size()).toBe(2);
				expect(scenario.choicesOf('/data/repeat[2]/select').size()).toBe(1);
			});
		});
	});
});

/**
 * **PORTING NOTES**
 *
 * Similar to `PredicateCachingTest.java`, for now we've skipped tests which
 * only assert the expected number of evaluations, and we've ported the
 * remaining tests which have apparent correctness concerns.
 */
describe('SelectCachingTest.java', () => {
	/**
	 * **PORTING NOTES**
	 *
	 * I've done my best here to intuit the intent of the test name from JavaRosa.
	 * It originally seemed that the test names may be back-referencing previous
	 * tests in source order, but it now seems like the `and` and `or` parts of
	 * the name reference the behavior of those operators in XPath expressions
	 * under test.
	 */
	describe('`and` of two eq choice filters', () => {
		it('is not confused with `or`', async () => {
			const scenario = await Scenario.init(
				'Some form',
				html(
					head(
						title('Some form'),
						model(
							mainInstance(t('data id="some-form"', t('choice'), t('select1'), t('select2'))),
							instance('instance', item('a', 'A'), item('b', 'B')),
							bind('/data/choice').type('string'),
							bind('/data/select1').type('string'),
							bind('/data/select2').type('string')
						)
					),
					body(
						input('/data/choice'),
						select1Dynamic(
							'/data/select1',
							"instance('instance')/root/item[value=/data/choice or value!=/data/choice]"
						),
						select1Dynamic(
							'/data/select2',
							"instance('instance')/root/item[value=/data/choice and value!=/data/choice]"
						)
					)
				)
			);

			scenario.answer('/data/choice', 'a');

			expect(scenario.choicesOf('/data/select1').size()).toBe(2);
			expect(scenario.choicesOf('/data/select2').size()).toBe(0);
		});
	});

	describe('nested predicates', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * Rephrase?
		 */
		it('[is] are correct after form state changes', async () => {
			const scenario = await Scenario.init(
				'Some form',
				html(
					head(
						title('Some form'),
						model(
							mainInstance(t('data id="some-form"', t('choice'), t('other_choice'), t('select'))),
							instance('instance', item('a', 'A'), item('b', 'B')),
							bind('/data/choice').type('string'),
							bind('/data/other_choice').type('string'),
							bind('/data/select').type('string')
						)
					),
					body(
						input('/data/choice'),
						input('/data/other_choice'),
						select1Dynamic(
							'/data/select',
							"instance('instance')/root/item[value=/data/choice][value=/data/other_choice]"
						)
					)
				)
			);

			scenario.answer('/data/choice', 'a');
			scenario.answer('/data/other_choice', 'a');

			expect(scenario.choicesOf('/data/select').size()).toBe(1);

			scenario.answer('/data/other_choice', 'b');

			expect(scenario.choicesOf('/data/select').size()).toBe(0);
		});
	});

	it('eq choice filters for ints work', async () => {
		const scenario = await Scenario.init(
			'Some form',
			html(
				head(
					title('Some form'),
					model(
						mainInstance(t('data id="some-form"', t('choice'), t('select'))),
						instance('instance', item('1', 'One'), item('2', 'Two')),
						bind('/data/choice').type('int'),
						bind('/data/select').type('string')
					)
				),
				body(
					input('/data/choice'),
					select1Dynamic('/data/select', "instance('instance')/root/item[value=/data/choice]")
				)
			)
		);

		scenario.answer('/data/choice', 1);

		expect(scenario.choicesOf('/data/select').size()).toBe(1);
	});
});

describe('SelectChoiceTest.java', () => {
	/**
	 * **PORTING NOTES**
	 *
	 * This test is select-specific, and comes from a select-specific JavaRosa
	 * file (er "bag"/"vat" 😂 @lognaturel), but falls into the same category as
	 * those from `FormDefSerializationTest.java` (also skipped in
	 * {@link ./serialization.test.ts}).
	 */
	it.skip('value_should_continue_being_an_empty_string_after_deserialization', async () => {
		const scenario = await Scenario.init(
			'SelectChoice.getValue() regression test form',
			html(
				head(
					title('SelectChoice.getValue() regression test form'),
					model(
						mainInstance(t('data id="some-form"', t('the-choice'))),
						bind('/data/the-choice').type('string').required()
					)
				),
				body(select1('/data/the-choice', label('Select one choice'), item('', 'Empty value')))
			)
		);

		scenario.next('/data/the-choice');

		expect(scenario.getQuestionAtIndex('select').getChoice(0).getValue()).toBe('');

		const deserializedScenario = await scenario.serializeAndDeserializeForm();

		await deserializedScenario.newInstance();

		deserializedScenario.next('/data/the-choice');

		expect(deserializedScenario.getQuestionAtIndex('select').getChoice(0).getValue()).toBe('');
	});

	/**
	 * **PORTING NOTES**
	 *
	 * The tests in this sub-suite are currently blocked by several absent features:
	 *
	 * 1. Retrieving external secondary instance resources
	 * 2. Support for external secondary instance resources when evaluating
	 *    XPath expressions referencing them
	 * 3. Any notion of engine API access to the well-known GeoJSON `geometry`
	 *    property, or any other arbitrary named child nodes present in any
	 *    secondary instance (whether external or otherwise)
	 */
	describe('`getChild`', () => {
		it.fails('returns named child when choices are from secondary instance', async () => {
			setUpSimpleReferenceManager(r('external-select-geojson.xml').getParent(), 'file');

			const scenario = await Scenario.init('external-select-geojson.xml');

			expect(scenario.choicesOf('/data/q').get(1)?.getChild('geometry')).toBe('0.5 104 0 0');
			expect(scenario.choicesOf('/data/q').get(1)?.getChild('special-property')).toBe(
				'special value'
			);
		});

		it.fails(
			'returns null when choices are from secondary instance and requested child does not exist',
			async () => {
				setUpSimpleReferenceManager(r('external-select-geojson.xml').getParent(), 'file');

				const scenario = await Scenario.init('external-select-geojson.xml');

				expect(scenario.choicesOf('/data/q').get(1)?.getChild('non-existent')).toBe(null);
			}
		);

		it.fails(
			'returns empty string when choices are from secondary instance and requested child has no value',
			async () => {
				const scenario = await Scenario.init(
					'Select with empty value',
					html(
						head(
							title('Select with empty value'),
							model(
								mainInstance(t("data id='select-empty'", t('select'))),
								instance('choices', t('item', t('label', 'Item'), t('property', '')))
							)
						),
						body(select1Dynamic('/data/select', "instance('choices')/root/item", 'name', 'label'))
					)
				);

				expect(scenario.choicesOf('/data/select').get(0)?.getChild('property')).toBe('');
			}
		);

		/**
		 * **PORTING NOTES**
		 *
		 * This test is also blocked on lack of support for repeat-based itemsets.
		 */
		it.fails('updates when choices are from repeat', async () => {
			const scenario = await Scenario.init(
				'Select from repeat',
				html(
					head(
						title('Select from repeat'),
						model(
							mainInstance(
								t(
									"data id='repeat-select'",
									t('repeat', t('value'), t('label'), t('special-property')),
									t('filter'),
									t('select')
								)
							)
						)
					),
					body(
						repeat('/data/repeat', input('value'), input('label'), input('special-property')),
						input('filter'),
						select1Dynamic('/data/select', '../repeat')
					)
				)
			);
			scenario.answer('/data/repeat[0]/value', 'a');
			scenario.answer('/data/repeat[0]/label', 'A');
			scenario.answer('/data/repeat[0]/special-property', 'AA');

			expect(scenario.choicesOf('/data/select').get(0)?.getValue()).toBe('a');
			expect(scenario.choicesOf('/data/select').get(0)?.getChild('special-property')).toBe('AA');

			scenario.answer('/data/repeat[0]/special-property', 'changed');

			expect(scenario.choicesOf('/data/select').get(0)?.getChild('special-property')).toBe(
				'changed'
			);
		});

		/**
		 * **PORTING NOTES**
		 *
		 * In theory, this could be made to pass! It makes more sense to fail it
		 * with the same error as the others above, as it is also subject to the
		 * same API design considerations. It also may be moot depending on our
		 * posture towards inline select items generally.
		 */
		it.fails('returns null when called on a choice from [an] inline select', async () => {
			const scenario = await Scenario.init(
				'Static select',
				html(
					head(
						title('Static select'),
						model(mainInstance(t("data id='static-select'", t('select'))))
					),
					body(select1('/data/select', item('one', 'One'), item('two', 'Two')))
				)
			);

			expect(scenario.choicesOf('/data/select').get(0)?.getChild('invalid-property')).toBe(
				nullValue()
			);
		});
	});

	/**
	 * **PORTING NOTES**
	 *
	 * It is already obvious at the outset that this API will fall into the same
	 * category as `getChild` above. Minimal effort has gone into porting these.
	 * Any further notes that might arise will come from further analysis when the
	 * affected functionality is prioritized.
	 */
	describe('`getAdditionalChildren`', () => {
		it.fails('returns children in order when choices are from secondary instance', async () => {
			setUpSimpleReferenceManager(r('external-select-geojson.xml').getParent(), 'file');

			const scenario = await Scenario.init('external-select-geojson.xml');

			const firstNodeChildren = scenario.choicesOf('/data/q').get(0)?.getAdditionalChildren();

			expect(firstNodeChildren?.size()).toBe(3);
			expect(firstNodeChildren?.get(0)).toEqual(['geometry', '0.5 102 0 0']);
			expect(firstNodeChildren?.get(1)).toEqual(['id', 'fs87b']);
			expect(firstNodeChildren?.get(2)).toEqual(['foo', 'bar']);

			const secondNodeChildren = scenario.choicesOf('/data/q').get(1)?.getAdditionalChildren();

			expect(secondNodeChildren?.size()).toBe(4);
			expect(secondNodeChildren?.get(0)).toEqual(['geometry', '0.5 104 0 0']);
			expect(secondNodeChildren?.get(1)).toEqual(['id', '67']);
			expect(secondNodeChildren?.get(2)).toEqual(['foo', 'quux']);
			expect(secondNodeChildren?.get(3)).toEqual(['special-property', 'special value']);
		});

		/**
		 * **PORTING NOTES**
		 *
		 * The corresponding JavaRosa test name begins with `getChildren`, which seems
		 * to be a typo (or surprising shorthand) for `getAdditionalChildren
		 */
		it.fails('updates when choices are from repeat', async () => {
			const scenario = await Scenario.init(
				'Select from repeat',
				html(
					head(
						title('Select from repeat'),
						model(
							mainInstance(
								t(
									"data id='repeat-select'",
									t('repeat', t('value'), t('label'), t('special-property')),
									t('filter'),
									t('select')
								)
							)
						)
					),
					body(
						repeat('/data/repeat', input('value'), input('label'), input('special-property')),
						input('filter'),
						select1Dynamic('/data/select', '../repeat')
					)
				)
			);
			scenario.answer('/data/repeat[0]/value', 'a');
			scenario.answer('/data/repeat[0]/label', 'A');
			scenario.answer('/data/repeat[0]/special-property', 'AA');

			expect(scenario.choicesOf('/data/select').get(0)?.getValue()).toBe('a');

			let children = scenario.choicesOf('/data/select').get(0)?.getAdditionalChildren();

			expect(children?.size()).toBe(2);
			expect(children?.get(0)).toEqual(['value', 'a']);
			expect(children?.get(1)).toEqual(['special-property', 'AA']);

			scenario.answer('/data/repeat[0]/special-property', 'changed');

			children = scenario.choicesOf('/data/select').get(0)?.getAdditionalChildren();

			expect(children?.get(1)).toEqual(['special-property', 'changed']);
		});

		/**
		 * **PORTING NOTES**
		 *
		 * Like the inline (non-itemset) select test for `getChild`, this could be
		 * made to pass, but was left failing with the rest of the sub-suite based
		 * on the same reasoning.
		 */
		it.fails('returns empty when called on a choice from inline select', async () => {
			const scenario = await Scenario.init(
				'Static select',
				html(
					head(
						title('Static select'),
						model(mainInstance(t("data id='static-select'", t('select'))))
					),
					body(select1('/data/select', item('one', 'One'), item('two', 'Two')))
				)
			);

			expect(scenario.choicesOf('/data/select').get(0)?.getAdditionalChildren().isEmpty()).toBe(
				true
			);
		});
	});
});

/**
 * **PORTING NOTES**
 *
 * As in JavaRosa, this test suite creates a new {@link Scenario} instance as
 * setup before each test. In JavaRosa, each test then begins by calling
 * {@link Scenario.newInstance | `scenario.newInstance`}. It isn't clear whether
 * those calls are superfluous **there**, but they would be here (if we
 * supported that `Scenario` method, which we have currently deferred). They're
 * commented out here, called out for review discussion, in case some nuance is
 * missed by omitting the calls.
 *
 * - - -
 *
 * Subjective preference note, also for review discussion: I'm generally in
 * favor of breaking out shared test setup/teardown steps. I was actually
 * surprised that this is the first case of it I've encountered working through
 * the JavaRosa test ports! It's also notable, however, that this setup is only
 * doing one thing... and then each test seems to be doing a redundant thing to
 * that setup. It strikes me that this is more verbose, less clear. Adding the
 * typical downsides of indirection-in-tests, I'd almost certainly favor just
 * inlining the setup at the beginning of each test body.
 *
 * My only real hesitation is that it's nice to see a few tests that are **not**
 * `async`! It's made me a tiny bit nervous with each test before this suite, as
 * I'm still generally cautious about having any asynchronous aspect of the
 * engine's APIs, particularly any aspect which might infect asynchrony up to
 * entire routines (as it does for tests which perform their own setup).
 *
 * - - -
 *
 * JR:
 *
 * When itemsets are dynamically generated, the choices available to a user in a
 * select multiple question can change based on the answers given to other
 * questions. These tests verify that when several select multiples are chained
 * in a cascading pattern, updating selections at root levels correctly updates
 * the choices available in dependent selects all the way down the cascade. They
 * also verify that if an answer that is no longer part of the available choices
 * was previously selected, that selection is removed from the answer.
 *
 * Select ones use the same code paths so see also
 * {@link SelectOneChoiceFilterTest} for more explicit cases at each level.
 */
describe('SelectMultipleChoiceFilterTest.java', () => {
	let scenario: Scenario;

	beforeEach(async () => {
		scenario = await Scenario.init('three-level-cascading-multi-select.xml');
	});

	describe('dependent levels in blank instance', () => {
		it(`[has] have no choices`, () => {
			// scenario.newInstance();
			expect(scenario.choicesOf('/data/level2').isEmpty()).toBe(true);
			expect(scenario.choicesOf('/data/level3').isEmpty()).toBe(true);
		});
	});

	describe('selecting value at level 1', () => {
		it('filters choices at level 2', () => {
			// scenario.newInstance();
			expect(scenario.choicesOf('/data/level2').isEmpty()).toBe(true);

			scenario.answer('/data/level1', 'a', 'b');

			expect(scenario.choicesOf('/data/level2')).toContainChoicesInAnyOrder([
				choice('aa'),
				choice('ab'),
				choice('ac'),
				choice('ba'),
				choice('bb'),
				choice('bc'),
			]);
		});
	});

	describe('selecting values at levels 1 and 2', () => {
		it('filters choices at level 3', () => {
			// scenario.newInstance();
			expect(scenario.choicesOf('/data/level2').isEmpty()).toBe(true);
			expect(scenario.choicesOf('/data/level3').isEmpty()).toBe(true);

			scenario.answer('/data/level1', 'a', 'b');
			scenario.answer('/data/level2', 'aa', 'ba');

			expect(scenario.choicesOf('/data/level3')).toContainChoicesInAnyOrder([
				choice('aaa'),
				choice('aab'),
				choice('baa'),
				choice('bab'),
			]);
		});
	});

	describe('new choice filter evaluation', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * - Rephrase "irrelevant" -> "filtered", some other phrasing indicating select items not present based on itemset filter expression results? The current naming suggests this is a test about the XForms **`relevant`** bind expression, but the test fixture has no `relevant` expressions at all.
		 *
		 * - Failure appears to be a bug where selection state is (partially) lost when changing an itemset filter updates the select's available items. Similar behavior can be observed on simpler forms, including at least one fixture previously derived from Enketo. This also appears to be at least partly related to deferring a decision on the appropriate behavior for the effect itemset filtering should have on selection state **when it is changed and then reverted** ({@link https://github.com/getodk/web-forms/issues/57}).
		 */
		it.fails('removes irrelevant answers at all levels, without changing order', () => {
			// scenario.newInstance();
			expect(scenario.choicesOf('/data/level2').isEmpty()).toBe(true);
			expect(scenario.choicesOf('/data/level3').isEmpty()).toBe(true);

			scenario.answer('/data/level1', 'a', 'b', 'c');
			scenario.answer('/data/level2', 'aa', 'ba', 'ca');
			scenario.answer('/data/level3', 'aab', 'baa', 'aaa');

			// Remove b from the level1 answer; this should filter out b-related answers and choices at levels 2 and 3
			scenario.answer('/data/level1', 'a', 'c');

			// Force populateDynamicChoices to run again which is what filters out irrelevant answers
			scenario.choicesOf('/data/level2');

			expect(scenario.answerOf('/data/level2')).toEqualAnswer(answerText('aa, ca'));

			// This also runs populateDynamicChoices and filters out irrelevant answers
			expect(scenario.choicesOf('/data/level3')).toContainChoices([
				choice('aaa'),
				choice('aab'),
				choice('caa'),
				choice('cab'),
			]);

			expect(scenario.answerOf('/data/level3')).toEqualAnswer(answerText('aab, aaa'));
		});

		it('leaves answer unchanged if all selections still in choices', () => {
			// scenario.newInstance();
			expect(scenario.choicesOf('/data/level2').isEmpty()).toBe(true);
			expect(scenario.choicesOf('/data/level3').isEmpty()).toBe(true);

			scenario.answer('/data/level1', 'a', 'b', 'c');
			scenario.answer('/data/level2', 'aa', 'ba', 'bb', 'ab');
			scenario.answer('/data/level3', 'aab', 'baa', 'aaa');

			// Remove c from the level1 answer; this should have no effect on levels 2 and 3
			scenario.answer('/data/level1', 'a', 'b');

			// Force populateDynamicChoices to run again which is what filters out irrelevant answers
			scenario.choicesOf('/data/level2');

			expect(scenario.answerOf('/data/level2')).toEqualAnswer(answerText('aa, ba, bb, ab'));

			// This also runs populateDynamicChoices and filters out irrelevant answers
			expect(scenario.choicesOf('/data/level3')).toContainChoicesInAnyOrder([
				choice('aaa'),
				choice('aab'),
				choice('baa'),
				choice('bab'),
			]);

			expect(scenario.answerOf('/data/level3')).toEqualAnswer(answerText('aab, baa, aaa'));
		});
	});
});

describe.todo('SelectOneChoiceFilterTest.java');