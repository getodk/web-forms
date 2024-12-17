import { xformAttachmentFixturesByDirectory } from '@getodk/common/fixtures/xform-attachments.ts';
import { JRResourceService } from '@getodk/common/jr-resources/JRResourceService.ts';
import { getBlobText } from '@getodk/common/lib/web-compat/blob.ts';
import {
	bind,
	body,
	group,
	head,
	html,
	input,
	instance,
	item,
	mainInstance,
	model,
	repeat,
	select1Dynamic,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import type { PartiallyKnownString } from '@getodk/common/types/string/PartiallyKnownString.ts';
import { constants as ENGINE_CONSTANTS } from '@getodk/xforms-engine';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { stringAnswer } from '../src/answer/ExpectedStringAnswer.ts';
import { Scenario } from '../src/jr/Scenario.ts';
import { setUpSimpleReferenceManager } from '../src/jr/reference/ReferenceManagerTestUtils.ts';
import { r } from '../src/jr/resource/ResourcePathHelper.ts';
import type { SelectChoice } from '../src/jr/select/SelectChoice.ts';

// Ported as of https://github.com/getodk/javarosa/commit/5ae68946c47419b83e7d28290132d846e457eea6
describe('Secondary instances', () => {
	/**
	 * **PORTING NOTES**
	 *
	 * In a Slack discussion, we decided to skip the first several tests in
	 * `PredicateCachingTest.java` (concerned with measuring the number of
	 * evaluations performed for a given form and/or action within it); we also
	 * decided to port the remaining tests (which exercise correctness concerns),
	 * organized into other modules as appropriate.
	 */
	describe('PredicateCachingTest.java', () => {
		/**
		 * JR:
		 * A form with multiple secondary instances can have expressions with "equivalent" predicates that filter on
		 * different sets of children. It's pretty possible to write a bug where these predicates are treated as the same
		 * thing causing incorrect answers.
		 */
		describe('equivalent predicate expressions on different references', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * 1. Rephrase as "produces distinct results from each secondary instance"?
			 * 2. The test itself could be more clear, presumably by making the
			 *    derived values from each secondary instance distinct.
			 *
			 * The test below is an attempt at that, but notably required a change
			 * to the test fixture. If we go with that, we'll probalby want to revise
			 * the original fixture (and perhaps revise both in JavaRosa).
			 */
			it('[is] are not confused', async () => {
				const scenario = await Scenario.init('two-secondary-instances.xml');

				scenario.next('/data/choice');
				scenario.answer('a');

				expect(scenario.answerOf('/data/both').getValue()).toBe('AA');
			});

			describe('(potentially clearer variation of above test)', () => {
				it('produces distinct results from each secondary instance', async () => {
					const scenario = await Scenario.init('two-secondary-instances-alt.xml');

					scenario.next('/data/choice');
					scenario.answer('c');

					expect(scenario.answerOf('/data/both').getValue()).toBe(
						'C (from instance_one)C (from instance_two)'
					);
				});
			});
		});

		describe('equivalent predicate expressions in repeats', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * 1. This description has been rephrased. Others like it will be
			 *    rephrased as we work on them.
			 *
			 * 2. The original JavaRosa test's second assertion checks for the answer
			 *    (`answerOf` return value) to be `equalTo(null)`. It seems likely
			 *    given the form's shape that the intent is to check that the field is
			 *    present and its value is blank, at that point in time.
			 */
			// JR: `doNotGetConfused`
			it("[re]computes separately within each respective repeat instance, when the predicate's dependencies affecting that node change", async () => {
				const scenario = await Scenario.init('repeat-secondary-instance.xml');

				scenario.createNewRepeat('/data/repeat');
				scenario.createNewRepeat('/data/repeat');

				scenario.answer('/data/repeat[1]/choice', 'a');

				expect(scenario.answerOf('/data/repeat[1]/calculate').getValue()).toBe('A');
				// assertThat(scenario.answerOf('/data/repeat[2]/calculate'), equalTo(null));
				expect(scenario.answerOf('/data/repeat[2]/calculate').getValue()).toBe('');

				scenario.answer('/data/repeat[2]/choice', 'b');

				expect(scenario.answerOf('/data/repeat[1]/calculate').getValue()).toBe('A');
				expect(scenario.answerOf('/data/repeat[2]/calculate').getValue()).toBe('B');
			});
		});

		describe('predicates on different child names', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * Rephrase?
			 */
			it('[does] do not get confused', async () => {
				const scenario = await Scenario.init(
					'Some form',
					html(
						head(
							title('Some form'),
							model(
								mainInstance(t('data id="some-form"', t('cat'), t('dog'), t('input'))),
								instance(
									'instance',
									t('cat', t('name', 'Vinnie'), t('age', '12')),
									t('dog', t('name', 'Vinnie'), t('age', '9'))
								),
								bind('/data/cat')
									.type('string')
									.calculate("instance('instance')/root/cat[name = /data/input]/age"),
								bind('/data/dog')
									.type('string')
									.calculate("instance('instance')/root/dog[name = /data/input]/age"),
								bind('/data/input').type('string')
							)
						),
						body(input('/data/input'))
					)
				);

				scenario.answer('/data/input', 'Vinnie');

				expect(scenario.answerOf('/data/cat').getValue()).toBe('12');
				expect(scenario.answerOf('/data/dog').getValue()).toBe('9');
			});
		});

		describe('eq expressions', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * Rephrase?
			 */
			it('work[s] if either side is relative', async () => {
				const scenario = await Scenario.init(
					'Some form',
					html(
						head(
							title('Some form'),
							model(
								mainInstance(t('data id="some-form"', t('calcltr'), t('calcrtl'), t('input'))),
								instance('instance', t('item', t('value', 'A')), t('item', t('value', 'B'))),
								bind('/data/calcltr')
									.type('string')
									.calculate("instance('instance')/root/item[value = /data/input]/value"),
								bind('/data/calcrtl')
									.type('string')
									.calculate("instance('instance')/root/item[/data/input = value]/value"),
								bind('/data/input').type('string')
							)
						),
						body(input('/data/input'))
					)
				);

				scenario.answer('/data/input', 'A');

				expect(scenario.answerOf('/data/calcltr').getValue()).toBe('A');
				expect(scenario.answerOf('/data/calcrtl').getValue()).toBe('A');

				scenario.answer('/data/input', 'B');

				expect(scenario.answerOf('/data/calcltr').getValue()).toBe('B');
				expect(scenario.answerOf('/data/calcrtl').getValue()).toBe('B');
			});

			/**
			 * **PORTING NOTES**
			 *
			 * Rephrase?
			 */
			it('work[s] if both sides are relative', async () => {
				const scenario = await Scenario.init(
					'Some form',
					html(
						head(
							title('Some form'),
							model(
								mainInstance(t('data id="some-form"', t('calc'), t('input'))),
								instance('instance', t('item', t('value', 'A'))),
								bind('/data/calc')
									.type('string')
									.calculate("instance('instance')/root/item[value = value]/value"),
								bind('/data/input').type('string')
							)
						),
						body(input('/data/input'))
					)
				);

				expect(scenario.answerOf('/data/calc').getValue()).toBe('A');
			});
		});

		describe('nested predicates', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * 1. Rephrase?
			 * 2. Treats null check as blank/empty string check, as with "equivalent
			 *    predicate expressions in repeats" block.
			 */
			it('[does] do not get confused', async () => {
				const scenario = await Scenario.init(
					'Some form',
					html(
						head(
							title('Some form'),
							model(
								mainInstance(
									t('data id="some-form"', t('calc'), t('calc2'), t('input1'), t('input2'))
								),
								instance(
									'instance',
									t('item', t('value', 'A'), t('count', '2'), t('id', 'A2')),
									t('item', t('value', 'A'), t('count', '3'), t('id', 'A3')),
									t('item', t('value', 'B'), t('count', '2'), t('id', 'B2'))
								),
								bind('/data/calc')
									.type('string')
									.calculate(
										"instance('instance')/root/item[value = /data/input1][count = '3']/id"
									),
								bind('/data/calc2')
									.type('string')
									.calculate(
										"instance('instance')/root/item[value = /data/input2][count = '3']/id"
									),
								bind('/data/input1').type('string'),
								bind('/data/input2').type('string')
							)
						),
						body(input('/data/input1'), input('/data/input2'))
					)
				);

				scenario.answer('/data/input1', 'A');
				scenario.answer('/data/input2', 'B');

				expect(scenario.answerOf('/data/calc').getValue()).toBe('A3');
				// assertThat(scenario.answerOf("/data/calc2"), equalTo(null));
				expect(scenario.answerOf('/data/calc2').getValue()).toBe('');
			});
		});

		describe('similar cmp and eq expressions', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * Rephrase?
			 */
			it('[does] do not get confused', async () => {
				const scenario = await Scenario.init(
					'Some form',
					html(
						head(
							title('Some form'),
							model(
								mainInstance(
									t('data id="some-form"', t('input'), t('calculate1'), t('calculate2'))
								),
								instance('instance', item('1', 'A'), item('2', 'B')),
								bind('/data/input').type('string'),
								bind('/data/calculate1')
									.type('string')
									.calculate("instance('instance')/root/item[value < /data/input]/label"),
								bind('/data/calculate2')
									.type('string')
									.calculate("instance('instance')/root/item[value = /data/input]/label")
							)
						),
						body(input('/data/input'))
					)
				);

				scenario.answer('/data/input', '2');

				expect(scenario.answerOf('/data/calculate1').getValue()).toBe('A');
				expect(scenario.answerOf('/data/calculate2').getValue()).toBe('B');
			});
		});

		describe('different eq expressions', () => {
			it('[is] are not confused', async () => {
				const scenario = await Scenario.init(
					'Some form',
					html(
						head(
							title('Some form'),
							model(
								mainInstance(
									t('data id="some-form"', t('calc1'), t('calc2'), t('input1'), t('input2'))
								),
								instance('instance', item('a', 'A'), item('b', 'B')),
								bind('/data/calc1')
									.type('string')
									.calculate("instance('instance')/root/item[value = /data/input1]/label"),
								bind('/data/calc2')
									.type('string')
									.calculate("instance('instance')/root/item[label = /data/input2]/label"),
								bind('/data/input').type('string')
							)
						),
						body(input('/data/input1'), input('/data/input2'))
					)
				);

				scenario.answer('/data/input1', 'a');
				scenario.answer('/data/input2', 'B');

				expect(scenario.answerOf('/data/calc1').getValue()).toBe('A');
				expect(scenario.answerOf('/data/calc2').getValue()).toBe('B');
			});
		});

		describe('different kinds of eq expressions', () => {
			it('[is] are not confused', async () => {
				const scenario = await Scenario.init(
					'Some form',
					html(
						head(
							title('Some form'),
							model(
								mainInstance(t('data id="some-form"', t('calc1'), t('calc2'), t('input'))),
								instance('instance', item('a', 'A'), item('b', 'B')),
								bind('/data/calc1')
									.type('string')
									.calculate("instance('instance')/root/item[value = 'a']/label"),
								bind('/data/calc2')
									.type('string')
									.calculate("instance('instance')/root/item[value != 'a']/label"),
								bind('/data/input').type('string')
							)
						),
						body(input('/data/input'))
					)
				);

				expect(scenario.answerOf('/data/calc1').getValue()).toBe('A');
				expect(scenario.answerOf('/data/calc2').getValue()).toBe('B');
			});
		});

		describe('repeat used in calculates', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * 1. Rephrase?
			 * 2. Null assertion -> blank/empty string
			 */
			it('stay[s] up to date', async () => {
				const scenario = await Scenario.init(
					'Some form',
					html(
						head(
							title('Some form'),
							model(
								mainInstance(
									t('data id="some-form"', t('repeat', t('name'), t('age')), t('result'))
								),
								bind('/data/repeat/input').type('string'),
								bind('/data/result')
									.type('string')
									.calculate("/data/repeat[name = 'John Bell']/age")
							)
						),
						body(
							group(
								'/data/repeat',
								repeat('/data/repeat', input('/data/repeat/name'), input('/data/repeat/age'))
							)
						)
					)
				);

				// assertThat(scenario.answerOf("/data/result"), equalTo(null));
				expect(scenario.answerOf('/data/result').getValue()).toBe('');

				scenario.createNewRepeat('/data/repeat');
				scenario.answer('/data/repeat[1]/name', 'John Bell');
				scenario.answer('/data/repeat[1]/age', '70');

				expect(scenario.answerOf('/data/result').getValue()).toBe('70');
			});
		});
	});

	/**
	 * **PORTING NOTES**
	 *
	 *-  Some of these tests are likely concerned with implementation details of
	 *   JavaRosa's parsing-specific APIs. We don't expose any parsing related
	 *   APIs directly in the engine/client interface. As such, tests of that
	 *   nature will be skipped. Tests which exercise pertinent engine/client
	 *   interface behavior (i.e. currently only those exercising form state) will
	 *   be included.
	 *
	 * - Some tests are concerned with XPath functionality. In general, the
	 *   `xpath` package is theoretically prepared to support external secondary
	 *   instances _depending on how we design that functionality in the engine_.
	 *   If we take an approach similar to that of Enketo—i.e. the resources are
	 *   retrieved on form init/when their presence in a form definition is known;
	 *   once retried, the resources are parsed and converted to a structure
	 *   suitable for evaluation as if they were "internal" secondary
	 *   instances—all of the XPath-specific work is already implemented.
	 *
	 * - We should consider creating alternate **integration tests** for each of
	 *   the parsing/XPath-specific tests. This effort is deferred for now, to
	 *   keep the porting effort moving along; it may be moot if equivalent tests
	 *   come up as that process concludes.
	 *
	 * - Each parsing/XPath-specific case will be marked {@link it.todo} with
	 *   the note: "Potentially test elsewhere and/or as integration test."
	 */
	describe('ExternalSecondaryInstanceParseTest.java', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * This is setting up retrieval logic for external resource URLs. Getting
		 * it to do the expected setup may mostly involve completing the port of
		 * {@link setUpSimpleReferenceManager} (as this is just a call to that
		 * with pre-defined arguments). We may want to use more idiomatic setup
		 * and teardown (though that would be less portable).
		 *
		 * A naive first pass on this included the note "what other way would we
		 * configure it?" Evidently we will also be porting
		 * {@link configureReferenceManagerIncorrectly}. Makes sense! We'll also
		 * be testing behavior when resource retrieval fails.
		 *
		 * We may want to consider a single
		 *
		 * - - -
		 *
		 * JR:
		 *
		 * All external secondary instances and forms are in the same folder.
		 * Configure the ReferenceManager to resolve URIs to that folder.
		 */
		const configureReferenceManagerCorrectly = () => {
			setUpSimpleReferenceManager(r('external-select-csv.xml').getParent(), 'file-csv', 'file');
		};

		/**
		 * **PORTING NOTES**
		 *
		 * Consider a single setup function, with its "correctness" parameterized?
		 *
		 * - - -
		 *
		 * JR:
		 *
		 * Configure the ReferenceManager to resolve URIs to a folder that does
		 * not exist.
		 */

		const configureReferenceManagerIncorrectly = () => {
			setUpSimpleReferenceManager(r('external-select-csv.xml'), 'file-csv', 'file');
		};

		describe('//region Parsing of different file types into external secondary instances', () => {
			describe('items from external secondary GeoJSON instance', () => {
				/**
				 * **PORTING NOTES**
				 *
				 * - Potentially test elsewhere and/or as integration test.
				 *
				 * - References form title (presumably as a sanity check that parsing
				 *   worked at all?). This prompted creation of `form.test.ts` so we have
				 *   some coverage of form titles when that functionality is implemented.
				 */
				it.todo('itemsFromExternalSecondaryXMLInstance_ShouldBeAvailableToXPathParser');

				/**
				 * **PORTING NOTES**
				 *
				 * Potentially test elsewhere and/or as integration test.
				 */
				it.todo('itemsFromExternalSecondaryGeoJsonInstance_ShouldBeAvailableToXPathParser');

				describe('with integer ids', () => {
					/**
					 * **PORTING NOTES**
					 *
					 * - Test is expected to fail pending support for external secondary
					 *   instances generally, and for GeoJSON specifically.
					 *
					 * - Given the current expected failure, it may mask any failure
					 *   around the call to {@link Scenario.answer} with a
					 *   {@link SelectChoice}. At a glance, I don't think this is
					 *   supported yet. We can address that when those pending features
					 *   make the test viable (or if any other test exercises that
					 *   signature sooner).
					 *
					 * - While it makes perfect sense that one might want to call
					 *   {@link Scenario.answer} this way, I really can't help but
					 *   reiterate previous concerns about overloaded signatures. Let's
					 *   really consider whether we might refine the {@link Scenario} API
					 *   to have more usage-specific methods, hopefully with less
					 *   complexity in their signatures.
					 *
					 * - It may be superfluous, but since external resource/secondary
					 *   instance/GeoJSON support is all pending, an assertion has been
					 *   added to check that the {@link SelectChoice} used to set the
					 *   question's value is not null. This may or may not be repeated in
					 *   subsequent test ports, but felt like a good strawman here to talk
					 *   about whether it's an appropriate check.
					 *
					 * - Typical `getDisplayText` -> `getValue`
					 */
					it('can be selected', async () => {
						configureReferenceManagerCorrectly();

						const scenario = await Scenario.init(r('external-select-geojson.xml'));
						const choiceWithIntId = scenario.choicesOf('/data/q').get(1);

						expect(choiceWithIntId).not.toBeNull();

						scenario.next('/data/q');
						scenario.answer(choiceWithIntId);

						// assertThat(scenario.answerOf("/data/q").getDisplayText(), is("67"));
						expect(scenario.answerOf('/data/q').getValue()).toBe('67');
					});
				});
			});

			describe('items from external secondary CSV instance', () => {
				/**
				 * **PORTING NOTES**
				 *
				 * Potentially test elsewhere and/or as integration test.
				 */
				it.todo('itemsFromExternalSecondaryCSVInstance_ShouldBeAvailableToXPathParser');
			});
		});

		/**
		 * **PORTING NOTES**
		 *
		 * Rephrase to be less specific about failure mode?
		 */
		describe('[failure] xformParseException', () => {
			describe('when itemset configures value or label not in external instance', () => {
				/**
				 * **PORTING NOTES**
				 *
				 * - Looking for... some BDD-ish description to fit the format here.
				 *
				 * - Fails because this doesn't currently produce an error condition.
				 *
				 * - Assertion of the error's instance type is not preserved. We should
				 *   discuss a more portable concept, and keep in mind our goal for
				 *   engine-produced errors to come in the form of a Result type.
				 */
				it.fails('[produces an error | fails to load | ?]', async () => {
					configureReferenceManagerCorrectly();

					const init = async () => {
						await Scenario.init(
							'Some form',
							html(
								head(
									title('Some form'),
									model(
										mainInstance(t('data id="some-form"', t('first'))),

										t('instance id="external-csv" src="jr://file-csv/external-data.csv"'),

										bind('/data/first').type('string')
									)
								),
								body(
									// Define a select using value and label references that don't exist in the secondary instance
									select1Dynamic('/data/first', "instance('external-csv')/root/item", 'foo', 'bar')
								)
							)
						);

						// JR:
						//
						// fail("Expected XFormParseException because itemset references don't exist in external instance");
					};

					// JR: } catch (XFormParseException e) {
					//	// pass

					await expect(init).rejects.toThrowError();
				});
			});
		});

		describe('CSV secondary instance with header only', () => {
			it('parses without error', async () => {
				configureReferenceManagerCorrectly();

				const scenario = await Scenario.init(
					'Some form',
					html(
						head(
							title('Some form'),
							model(
								mainInstance(t('data id="some-form"', t('first'))),

								t('instance id="external-csv" src="jr://file-csv/header_only.csv"'),

								bind('/data/first').type('string')
							)
						),
						body(select1Dynamic('/data/first', "instance('external-csv')/root/item"))
					)
				);

				expect(scenario.choicesOf('/data/first').size()).toBe(0);
			});
		});

		/**
		 * **PORTING NOTES**
		 *
		 * These tests exercise JavaRosa's internal `FormParseInit`. It's unclear if
		 * there's an appropriate way to test these details, or if the functionality
		 * would be applicable outside of hypothetical Collect integration.
		 *
		 * - - -
		 *
		 * JR:
		 *
		 * ODK Collect has CSV-parsing features that bypass XPath and use databases.
		 * This test verifies that if a secondary instance is declared but not
		 * referenced in an instance() call, it is ignored by JavaRosa.
		 */
		describe.skip('//region ODK Collect database-driven external file features', () => {
			it.skip('externalInstanceDeclaration_ShouldBeIgnored_WhenNotReferenced');
			it.skip(
				'externalInstanceDeclaration_ShouldBeIgnored_WhenNotReferenced_AfterParsingFormWithReference'
			);
		});

		/**
		 * **PORTING NOTES**
		 *
		 * Potentially test elsewhere and/or as integration test.
		 *
		 * - - -
		 *
		 * JR:
		 *
		 * See https://github.com/getodk/javarosa/issues/451
		 */
		it.todo('dummyNodesInExternalInstanceDeclaration_ShouldBeIgnored');

		/**
		 * **PORTING NOTES**
		 *
		 * This sub-suite has been updated to reflect different semantics and expectations for missing external secondary instances between JavaRosa and Web Forms:
		 *
		 * - By default, Web Forms will fail to initialize a form when any of the external secondary instances are missing (i.e. with HTTP 404 semantics).
		 *
		 * - By optional configuration, Web Forms may ignore missing external secondary instances, treating them as blank.
		 */
		describe('//region Missing external file', () => {
			// JR: emptyPlaceholderInstanceIsUsed_whenExternalInstanceNotFound
			it.fails(
				'[uses an] empty placeholder [~~]is used[~~] when [referenced] external instance [is] not found',
				async () => {
					configureReferenceManagerIncorrectly();

					const scenario = await Scenario.init('external-select-csv.xml');

					expect(scenario.choicesOf('/data/first').size()).toBe(0);
				}
			);

			/**
			 * **PORTING NOTES**
			 *
			 * Supplemental, exercises configured override of default missing resource
			 * behavior.
			 */
			it('uses an empty/blank placeholder when not found, and when overriding configuration is specified', async () => {
				configureReferenceManagerIncorrectly();

				const scenario = await Scenario.init(
					'Missing resource treated as blank',
					// prettier-ignore
					html(
						head(
							title('Missing resource treated as blank'),
							model(
								mainInstance(
									t('data id="missing-resource-treated-as-blank"',
										t('first'))),

								t('instance id="external-csv" src="jr://file-csv/missing.csv"'),

								bind('/data/first').type('string')
							)
						),
						body(
							select1Dynamic(
								'/data/first',
								"instance('external-csv')/root/item"
							)
						)
					),
					{
						missingResourceBehavior: ENGINE_CONSTANTS.MISSING_RESOURCE_BEHAVIOR.BLANK,
					}
				);

				expect(scenario.choicesOf('/data/first').size()).toBe(0);
			});
		});
	});

	describe('basic external secondary instance support', () => {
		const xmlAttachmentFileName = 'xml-attachment.xml';
		const xmlAttachmentURL = `jr://file/${xmlAttachmentFileName}` as const;
		const csvAttachmentFileName = 'csv-attachment.csv';
		const csvAttachmentURL = `jr://file/${csvAttachmentFileName}` as const;
		const formTitle = 'External secondary instance (XML and CSV)';
		const formDefinition = html(
			head(
				title(formTitle),
				model(
					// prettier-ignore
					mainInstance(
						t('data id="external-secondary-instance-xml-csv"',
							t('first'),
							t('second'))),

					t(`instance id="external-xml" src="${xmlAttachmentURL}"`),
					t(`instance id="external-csv" src="${csvAttachmentURL}"`),

					bind('/data/first').type('string'),
					bind('/data/second').type('string')
				)
			),
			body(
				select1Dynamic(
					'/data/first',
					"instance('external-xml')/instance-root/instance-item",
					'item-value',
					'item-label'
				),
				select1Dynamic(
					'/data/second',
					"instance('external-csv')/root/item",
					'item-value',
					'item-label'
				)
			)
		);

		const activateFixtures = () => {
			resourceService.activateFixtures(fixturesDirectory, ['file', 'file-csv']);
		};

		let fixturesDirectory: string;
		let resourceService: JRResourceService;

		beforeEach(() => {
			const scenarioFixturesDirectory = Array.from(xformAttachmentFixturesByDirectory.keys()).find(
				(key) => {
					return key.endsWith('/test-scenario');
				}
			);

			if (scenarioFixturesDirectory == null) {
				throw new Error(`Failed to get file system path for fixtures directory: "test-scenario"`);
			}

			fixturesDirectory = scenarioFixturesDirectory;

			resourceService = new JRResourceService();
		});

		afterEach(() => {
			resourceService.reset();
		});

		it('supports external secondary instances (XML, file system fixture)', async () => {
			activateFixtures();

			const scenario = await Scenario.init(formTitle, formDefinition, {
				resourceService,
			});

			scenario.answer('/data/first', 'a');

			expect(scenario.answerOf('/data/first')).toEqualAnswer(stringAnswer('a'));
		});

		it('supports external secondary instances (CSV, file system fixture)', async () => {
			activateFixtures();

			const scenario = await Scenario.init(formTitle, formDefinition, {
				resourceService,
			});

			scenario.answer('/data/second', 'y');

			expect(scenario.answerOf('/data/second')).toEqualAnswer(stringAnswer('y'));
		});
	});

	describe('CSV parsing', () => {
		const BOM = '\ufeff';
		type BOM = typeof BOM;

		// prettier-ignore
		type ColumnDelimiter =
			| ','
			| ';'
			| '\t'
			| '|';

		// prettier-ignore
		type RowDelimiter =
			| '\n'
			| '\r'
			| '\r\n';

		type ExpectedFailure = 'parse' | 'select-value';

		interface CSVCase {
			readonly description: string;

			/** @default ',' */
			readonly columnDelimiter?: PartiallyKnownString<ColumnDelimiter>;

			/** @default '\n' */
			readonly rowDelimiter?: PartiallyKnownString<RowDelimiter>;

			/** @default '' */
			readonly bom?: BOM | '';

			/** @default 0 */
			readonly columnPadding?: number;

			/** @default null */
			readonly expectedFailure?: ExpectedFailure | null;

			/** @default null */
			readonly surprisingSuccessWarning?: string | null;
		}

		const csvCases: readonly CSVCase[] = [
			{
				description: 'BOM is not treated as part of first column header',
				bom: BOM,
			},
			{
				description: 'column delimiter: semicolon',
				columnDelimiter: ';',
			},
			{
				description: 'column delimiter: tab',
				columnDelimiter: '\t',
			},
			{
				description: 'column delimiter: pipe',
				columnDelimiter: '|',
			},
			{
				description: 'unsupported column delimiter: $',
				columnDelimiter: '$',
				expectedFailure: 'parse',
			},
			{
				description: 'row delimiter: LF',
				rowDelimiter: '\n',
			},
			{
				description: 'row delimiter: CR',
				rowDelimiter: '\r',
			},
			{
				description: 'row delimiter: CRLF',
				rowDelimiter: '\r\n',
			},
			{
				description: 'unsupported row delimiter: LFLF',
				rowDelimiter: `\n\n`,
				expectedFailure: 'parse',
			},

			{
				description: 'somewhat surprisingly supported row delimiter: LFCR',
				rowDelimiter: `\n\r`,
				surprisingSuccessWarning:
					"LFCR is not an expected line separator in any known-common usage. It's surprising that Papaparse does not fail parsing this case, at least parsing rows!",
			},

			{
				description: 'whitespace padding around column delimiter is not ignored (by default)',
				columnDelimiter: ',',
				columnPadding: 1,
				expectedFailure: 'select-value',
			},
		];

		// Note: this isn't set up with `describe.each` because it would create a superfluous outer description where the inner description must be applied with `it` (to perform async setup)
		csvCases.forEach(
			({
				description,
				columnDelimiter = ',',
				rowDelimiter = '\n',
				bom = '',
				columnPadding = 0,
				expectedFailure = null,
				surprisingSuccessWarning = null,
			}) => {
				const LOWER_ALPHA_ASCII_LETTER_COUNT = 26;
				const lowerAlphaASCIILetters = Array.from(
					{
						length: LOWER_ALPHA_ASCII_LETTER_COUNT,
					},
					(_, i) => {
						return String.fromCharCode(i + 97);
					}
				);

				type CSVRow = readonly [itemLabel: string, itemValue: string];

				const rows: readonly CSVRow[] = [
					['item-label', 'item-value'],

					...lowerAlphaASCIILetters.map((letter): CSVRow => {
						return [letter.toUpperCase(), letter];
					}),
				];
				const baseCSVFixture = rows
					.map((row) => {
						const padding = ' '.repeat(columnPadding);
						const delimiter = `${padding}${columnDelimiter}${padding}`;

						return row.join(delimiter);
					})
					.join(rowDelimiter);

				const csvAttachmentFileName = 'csv-attachment.csv';
				const csvAttachmentURL = `jr://file/${csvAttachmentFileName}` as const;
				const formTitle = 'External secondary instance (CSV)';
				const formDefinition = html(
					head(
						title(formTitle),
						model(
							// prettier-ignore
							mainInstance(
						t('data id="external-secondary-instance-csv"',
							t('letter'))),

							t(`instance id="external-csv" src="${csvAttachmentURL}"`),

							bind('/data/letter').type('string')
						)
					),
					body(
						select1Dynamic(
							'/data/letter',
							"instance('external-csv')/root/item",
							'item-value',
							'item-label'
						)
					)
				);

				let resourceService: JRResourceService;

				beforeEach(() => {
					resourceService = new JRResourceService();
				});

				afterEach(() => {
					resourceService.reset();
				});

				it(description, async () => {
					let csvFixture: string;

					if (bom === '') {
						csvFixture = baseCSVFixture;
					} else {
						const blob = new Blob([bom, baseCSVFixture]);

						csvFixture = await getBlobText(blob);
					}

					resourceService.activateResource(
						{
							url: csvAttachmentURL,
							fileName: csvAttachmentFileName,
							mimeType: 'text/csv',
						},
						csvFixture
					);

					const letterIndex = Math.floor(Math.random() * LOWER_ALPHA_ASCII_LETTER_COUNT);
					const letter = lowerAlphaASCIILetters[letterIndex]!;

					const initScenario = async (): Promise<Scenario> => {
						return await Scenario.init(formTitle, formDefinition, {
							resourceService,
						});
					};

					if (expectedFailure === 'parse') {
						const initParseFailure = async () => {
							await initScenario();
						};

						await expect(initParseFailure).rejects.toThrowError();

						return;
					}

					if (surprisingSuccessWarning != null) {
						// eslint-disable-next-line no-console
						console.warn(surprisingSuccessWarning);
					}

					const scenario = await initScenario();

					scenario.answer('/data/letter', letter);

					if (expectedFailure === 'select-value') {
						expect(scenario.answerOf('/data/letter')).toEqualAnswer(stringAnswer(''));
					} else {
						expect(scenario.answerOf('/data/letter')).toEqualAnswer(stringAnswer(letter));
					}
				});
			}
		);
	});
});
