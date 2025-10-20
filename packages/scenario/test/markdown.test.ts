import {
	bind,
	body,
	head,
	html,
	input,
	item,
	mainInstance,
	model,
	select1,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { Scenario } from '../src/jr/Scenario.ts';

describe('Markdown', () => {
	const run = async (given: string, ...expected: object[]) => {
		const scenario = await Scenario.init(
			'markdown',
			html(
				head(
					title('markdown'),
					model(mainInstance(t('data id="markdown"', t('name'))), bind('/data/name').type('string'))
				),
				body(input('/data/name', t('label', given)))
			)
		);
		scenario.next('/data/name');
		const label = scenario.getQuestionLabel({ assertCurrentReference: '/data/name' }).formatted;
		expect(label.length).toEqual(expected.length);
		expect(label).toMatchObject(expected);
	};

	it('should do nothing with plaintext', async () => {
		await run('nothing to see here', {
			elementName: 'p',
			children: [{ value: 'nothing to see here' }],
		});
	});

	it('should do nothing with escaped markdown', async () => {
		await run('\\# nothing \\*to\\* see here', {
			elementName: 'p',
			children: [{ value: '# nothing *to* see here' }],
		});
	});

	describe('should handle headings', () => {
		it('h1', async () => {
			await run('# big heading', { elementName: 'h1', children: [{ value: 'big heading' }] });
		});
		it('h2', async () => {
			await run('## big heading', { elementName: 'h2', children: [{ value: 'big heading' }] });
		});
		it('h3', async () => {
			await run('### big heading', { elementName: 'h3', children: [{ value: 'big heading' }] });
		});
		it('h4', async () => {
			await run('#### big heading', { elementName: 'h4', children: [{ value: 'big heading' }] });
		});
		it('h5', async () => {
			await run('##### big heading', { elementName: 'h5', children: [{ value: 'big heading' }] });
		});
		it('h6', async () => {
			await run('###### big heading', { elementName: 'h6', children: [{ value: 'big heading' }] });
		});
		it('h7', async () => {
			// h6 is the max
			await run('####### big heading', {
				elementName: 'p',
				children: [{ value: '####### big heading' }],
			});
		});
	});

	describe('should handle emphasis', () => {
		// TODO can we drop the 'p' element??
		const expected = {
			elementName: 'p',
			children: [
				{
					elementName: 'em',
					children: [{ value: 'emphasize' }],
				},
				{ value: ' me' },
			],
		};

		it('asterisk style', async () => {
			await run('*emphasize* me', expected);
		});

		it('underscore style', async () => {
			await run('_emphasize_ me', expected);
		});
	});

	describe('should handle strong', () => {
		const expected = {
			elementName: 'p',
			children: [
				{
					elementName: 'strong',
					children: [{ value: 'strengthen' }],
				},
				{ value: ' me' },
			],
		};

		it('asterisk style', async () => {
			await run('**strengthen** me', expected);
		});

		it('underscore style', async () => {
			await run('__strengthen__ me', expected);
		});
	});

	describe('should handle lists', () => {
		it('ordered', async () => {
			// TODO this is deeper than it probably needs to be?
			const given = `1. first
2. second
3. third`;
			const expected = {
				elementName: 'ol',
				children: [
					{
						elementName: 'li',
						children: [{ elementName: 'p', children: [{ value: 'first' }] }],
					},
					{
						elementName: 'li',
						children: [{ elementName: 'p', children: [{ value: 'second' }] }],
					},
					{
						elementName: 'li',
						children: [{ elementName: 'p', children: [{ value: 'third' }] }],
					},
				],
			};
			await run(given, expected);
		});

		it('unordered', async () => {
			const given = `- first
- second
- third`;
			const expected = {
				elementName: 'ul',
				children: [
					{
						elementName: 'li',
						children: [{ elementName: 'p', children: [{ value: 'first' }] }],
					},
					{
						elementName: 'li',
						children: [{ elementName: 'p', children: [{ value: 'second' }] }],
					},
					{
						elementName: 'li',
						children: [{ elementName: 'p', children: [{ value: 'third' }] }],
					},
				],
			};
			await run(given, expected);
		});
	});

	describe('should handle html', () => {
		it('styled span', async () => {
			await run('can &lt;span style="color:red"&gt;style&lt;/span&gt; things', {
				elementName: 'p',
				children: [
					{ value: 'can ' },
					{
						elementName: 'span',
						children: [{ value: 'style' }],
						properties: { style: { color: 'red' } },
					},
					{ value: ' things' },
				],
			});
		});

		it('styled div', async () => {
			await run('can &lt;div style="text-align:center"&gt;style&lt;/div&gt; things', {
				elementName: 'p',
				children: [
					{ value: 'can ' },
					{
						elementName: 'div',
						children: [{ value: 'style' }],
						properties: { style: { 'text-align': 'center' } },
					},
					{ value: ' things' },
				],
			});
		});

		describe('line breaks', () => {
			it('single', async () => {
				const given = `hello
single line break`;

				await run(given, { elementName: 'p', children: [{ value: 'hello\nsingle line break' }] });
			});

			it('double', async () => {
				const given = `hello

double line break`;

				await run(
					given,
					{ elementName: 'p', children: [{ value: 'hello' }] },
					{ elementName: 'p', children: [{ value: 'double line break' }] }
				);
			});
		});
	});

	it('should handle nested markup', async () => {
		await run('normal *italic __both__ italic again* back to normal', {
			elementName: 'p',
			children: [
				{ value: 'normal ' },
				{
					elementName: 'em',
					children: [
						{ value: 'italic ' },
						{
							elementName: 'strong',
							children: [{ value: 'both' }],
						},
						{ value: ' italic again' },
					],
				},
				{ value: ' back to normal' },
			],
		});
	});

	it('should work with translated text', async () => {
		const scenario = await Scenario.init(
			'markdown',
			html(
				head(
					title('markdown'),
					model(
						t(
							'itext',
							t(
								'translation lang="default"',
								t('text id="/data/name:label"', t('value', '**Name**'))
							),
							t('translation lang="fr"', t('text id="/data/name:label"', t('value', '*Nom*')))
						),
						mainInstance(t('data id="markdown"', t('name'))),
						bind('/data/name').type('string')
					)
				),
				body(input('/data/name', t(`label ref="jr:itext('/data/name:label')"`)))
			)
		);

		scenario.next('/data/name');
		let label;

		label = scenario.getQuestionLabel({ assertCurrentReference: '/data/name' }).formatted;
		expect(label.length).toEqual(1);
		expect(label[0]).toMatchObject({
			elementName: 'p',
			children: [{ elementName: 'strong', children: [{ value: 'Name' }] }],
		});

		scenario.setLanguage('fr');
		label = scenario.getQuestionLabel({ assertCurrentReference: '/data/name' }).formatted;
		expect(label.length).toEqual(1);
		expect(label[0]).toMatchObject({
			elementName: 'p',
			children: [{ elementName: 'em', children: [{ value: 'Nom' }] }],
		});
	});

	describe('should handle output elements', () => {
		const outputScenario = async () => {
			return await Scenario.init(
				'markdown',
				html(
					head(
						title('markdown'),
						model(
							t(
								'itext',
								t(
									'translation lang="default"',
									t(
										'text id="/data/name:label"',
										t('value', `**Dear <output value=" /data/name " />!** Welcome.`)
									)
								)
							),
							mainInstance(t('data id="markdown"', t('name'))),
							bind('/data/name').type('string')
						)
					),
					body(input('/data/name', t(`label ref="jr:itext('/data/name:label')"`)))
				)
			);
		};

		it('style wraps output elements', async () => {
			const scenario = await outputScenario();
			scenario.next('/data/name');
			scenario.answer('Alice');
			const label = scenario.getQuestionLabel({ assertCurrentReference: '/data/name' }).formatted;
			expect(label.length).toEqual(1);
			expect(label[0]).toMatchObject({
				elementName: 'p',
				children: [
					{
						elementName: 'strong',
						children: [
							{ value: 'Dear ' },
							{
								elementName: 'span',
								children: [{ elementName: 'p', children: [{ value: 'Alice' }] }],
							},
							{ value: '!' },
						],
					},
					{ value: ' Welcome.' },
				],
			});
		});

		it('marks up output element content', async () => {
			const scenario = await outputScenario();
			scenario.next('/data/name');
			scenario.answer('Alice _nee_ Sally');
			const label = scenario.getQuestionLabel({ assertCurrentReference: '/data/name' }).formatted;
			expect(label.length).toEqual(1);
			expect(label[0]).toMatchObject({
				elementName: 'p',
				children: [
					{
						elementName: 'strong',
						children: [
							{ value: 'Dear ' },
							{
								elementName: 'span',
								children: [
									{
										elementName: 'p',
										children: [
											{ value: 'Alice ' },
											{ elementName: 'em', children: [{ value: 'nee' }] },
											{ value: ' Sally' },
										],
									},
								],
							},
							{ value: '!' },
						],
					},
					{ value: ' Welcome.' },
				],
			});
		});
	});

	it('should work in select options', async () => {
		const scenario = await Scenario.init(
			'markdown',
			html(
				head(title('markdown'), model(mainInstance(t("data id='select'", t('select'))))),
				body(
					select1(
						'/data/select',
						item('strong', '**option one**'),
						item('emphasis', '_option two_'),
						item('normal', 'option three')
					)
				)
			)
		);

		scenario.next('/data/select');
		scenario.answer('strong');

		const label = scenario.getSelectedOptionLabels({
			assertCurrentReference: '/data/select',
		});
		expect(label.length).toEqual(1);
		const formatted = label[0]!.formatted;
		expect(formatted.length).toEqual(1);
		expect(formatted[0]).toMatchObject({
			elementName: 'p',
			children: [
				{
					elementName: 'strong',
					children: [{ value: 'option one' }],
				},
			],
		});
	});

	it('should work in select options', async () => {
		const scenario = await Scenario.init(
			'markdown',
			html(
				head(
					title('markdown'),
					model(mainInstance(t('data id="markdown"', t('name'))), bind('/data/name').type('string'))
				),
				body(
					input(
						'/data/name',
						t('label', 'hint field'),
						t('hint', 'We **strongly** recommend filling in this field')
					)
				)
			)
		);

		scenario.next('/data/name');
		const hint = scenario.getQuestionHint({ assertCurrentReference: '/data/name' }).formatted;
		expect(hint.length).toEqual(1);
		expect(hint[0]).toMatchObject({
			elementName: 'p',
			children: [
				{ value: 'We ' },
				{
					elementName: 'strong',
					children: [{ value: 'strongly' }],
				},
				{ value: ' recommend filling in this field' },
			],
		});
	});

	it('should work in constraints', async () => {
		const scenario = await Scenario.init(
			'Validation fixture',
			html(
				head(
					title('Validation fixture'),
					model(
						mainInstance(
							t('data id="validation-fixture"', t('constrained-input'), t('required-input'))
						),
						bind('/data/required-input')
							.required()
							.withAttribute('jr', 'requiredMsg', 'Field is _totally_ required')
					)
				),
				body(input('/data/constrained-input'), input('/data/required-input'))
			)
		);
		const result = scenario.answerOf('/data/required-input');
		const formatted = result.node.validationState.required.message?.formatted ?? [];
		expect(formatted.length).toEqual(1);
		expect(formatted[0]).toMatchObject({
			elementName: 'p',
			children: [
				{ value: 'Field is ' },
				{
					elementName: 'em',
					children: [{ value: 'totally' }],
				},
				{ value: ' required' },
			],
		});
	});
});
