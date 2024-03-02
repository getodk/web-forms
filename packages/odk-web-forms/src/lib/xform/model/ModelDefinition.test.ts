import { expectEqualNode } from '@odk/common/test/assertions/dom.ts';
import { xformsElement } from '@odk/common/test/factories/xml.ts';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	bind,
	body,
	group,
	head,
	html,
	input,
	label,
	mainInstance,
	model,
	repeat,
	t,
	title,
} from '../../../test/fixtures/xform-dsl/index.ts';
import { XFormDefinition } from '../XFormDefinition.ts';
import { BindDefinition } from './BindDefinition.ts';
import { ModelDefinition } from './ModelDefinition.ts';
import type { AnyNodeDefinition } from './NodeDefinition.ts';
import { RepeatSequenceDefinition } from './RepeatSequenceDefinition.ts';
import type { ValueNodeDefinition } from './ValueNodeDefinition.ts';

describe('ModelDefinition', () => {
	let modelDefinition: ModelDefinition;

	beforeEach(() => {
		const xform = html(
			head(
				title('Model definition'),
				model(
					mainInstance(
						t(
							`root id="model-definition"`,
							t('first-question'),
							t('second-question'),
							t('third-question')
						)
					),
					bind('/root/first-question').type('string'),
					bind('/root/second-question').type('string'),
					bind('/root/third-question').type('string')
				)
			),
			// prettier-ignore
			body(
				input('/root/first-question', label('First question')),
				input('/root/second-question')
			)
		);

		const xformDefinition = new XFormDefinition(xform.asXml());

		modelDefinition = xformDefinition.model;
	});

	it.each([
		{ nodeset: '/root/first-question' },
		{ nodeset: '/root/second-question' },
		{ nodeset: '/root/third-question' },
	])('defines model bindings for $nodeset', ({ nodeset }) => {
		const bindDefinition = modelDefinition.binds.get(nodeset);

		expect(bindDefinition).toBeInstanceOf(BindDefinition);
	});

	it('defines a tree representation of the model', () => {
		const { root } = modelDefinition;

		expect(root).toMatchObject({
			type: 'root',
			bind: {
				nodeset: '/root',
			},
			children: [
				{
					type: 'value-node',
					bind: {
						nodeset: '/root/first-question',
					},
					children: null,
				},
				{
					type: 'value-node',
					bind: {
						nodeset: '/root/second-question',
					},
					children: null,
				},
				{
					type: 'value-node',
					bind: {
						nodeset: '/root/third-question',
					},
					children: null,
				},
			],
		});
	});

	it.each([
		{
			index: 0,
			expected: {
				type: 'input',
				label: { children: [expect.anything()] },
			},
		},
		{
			index: 1,
			expected: { type: 'input', label: null },
		},
		{
			index: 2,
			expected: null,
		},
	])('includes a reference to the $index body element definition', ({ index, expected }) => {
		const child = modelDefinition.root.children[index] as ValueNodeDefinition;

		if (expected == null) {
			expect(child.bodyElement).toBeNull();
		} else {
			expect(child.bodyElement).toMatchObject(expected);
		}
	});

	// These tests were originally defined in `BodyDefinition.test.ts`, against
	// the `body` property of an `XFormDefinition`. The separate presence of
	// `body` has been a source of some confusion. In reality, an XForm's body
	// is parsed ahead of its model (well, its head, including the model as
	// well as the binds, which are more analogous to a controller) because
	// aspects of the body are important for determining the entire scope of a
	// given field or other form aspect.
	//
	// The structure which ultimately matters downstream, to the "engine", is
	// contained entirely within what we currently call the `ModelDefinition`.
	// References into the body are resolved as a next parsing stage, and then
	// the `body` property itself becomes effectively moot. So... we're going to
	// eliminate this source of confusion. First step: preserving whatever is
	// valuable about the body tests, in the place where they actually matter.
	describe('information derived from the XForm body, in greater detail', () => {
		beforeEach(() => {
			const xform = html(
				head(
					title('Body definition'),
					model(
						mainInstance(
							// prettier-ignore
							t('root id="body-definition"',

								// prettier-ignore
								t('input'),
								t('input-label-hint'),

								// prettier-ignore
								t('loggrp',
									// prettier-ignore
									t('lg-child-1'),
									t('lg-child-2')
								),

								// prettier-ignore
								t('loggrp-2',
									// prettier-ignore
									t('lg2-1'),
									t('lg2-2')
								),

								// prettier-ignore
								t('presgrp',
									// prettier-ignore
									t('pg-a'),
									t('pg-b')
								),

								t('sg-1'),
								t('sg-2'),
								t('sg-3'),
								t('sg-4'),
								t('sg-5'),

								// prettier-ignore
								t('rep1',
									t('r1-1'),
									t('r1-2')
								),

								// prettier-ignore
								t('rep2',
									t('r2-1')
								),

								// prettier-ignore
								t('unrelated-grp',
									t('rep3',
										t('r3-1')
									)
								)
							)
						),
						bind('/root/input'),
						bind('/root/input-label-hint'),
						bind('/root/loggrp'),
						bind('/root/loggrp/lg-child-1'),
						bind('/root/loggrp/lg-child-2'),
						bind('/root/loggrp-2/lg2-1'),
						bind('/root/loggrp-2/lg2-2'),
						bind('/root/presgrp/pg-a'),
						bind('/root/presgrp/pg-b'),
						bind('/root/sg-1'),
						bind('/root/sg-2'),
						bind('/root/sg-3'),
						bind('/root/sg-4'),
						bind('/root/sg-5'),
						bind('/root/rep1'),
						bind('/root/rep1/r1-1'),
						bind('/root/rep1/r1-2'),
						bind('/root/rep2/r2-1'),
						bind('/root/unrelated-grp'),
						bind('/root/unrelated-grp/rep3/r3-1')
					)
				),
				body(
					input('/root/input'),

					// prettier-ignore
					input('/root/input-label-hint',
						// prettier-ignore
						label('Label text'),
						t('hint', 'Hint text')
					),

					// prettier-ignore
					group('/root/loggrp',
						input('/root/loggrp/lg-child-1'),
						input(
							'/root/loggrp/lg-child-2',
							// prettier-ignore
							label('Logical group child 2')
						)
					),

					// prettier-ignore
					group('/root/loggrp-2',
						label('Logical group 2 with label'),

						input('/root/loggrp-2/lg2-1'),
						input('/root/loggrp-2/lg2-2')
					),

					// prettier-ignore
					t('group',
						label('Presentation group label'),

						input('/root/presgrp/pg-a'),
						input('/root/presgrp/pg-b', label('Presentation group child b'))
					),

					// prettier-ignore
					t('group',
						input('/root/sg-1'),
						input('/root/sg-2'),
						input('/root/sg-3'),
						input('/root/sg-4'),
						input('/root/sg-5')
					),

					// prettier-ignore
					group('/root/rep1',
						label('Repeat group'),

						// prettier-ignore
						repeat('/root/rep1',
							input('/root/rep1/r1-1'),

							// prettier-ignore
							input('/root/rep1/r1-2',
								label('Repeat 1 input 2'))
						)
					),

					// prettier-ignore
					repeat('/root/rep2',
						input('/root/rep2/r2-1')
					),

					// prettier-ignore
					group('/root/unrelated-grp',
						label('Group unrelated to the repeat it contains'),

						// prettier-ignore
						repeat('/root/unrelated-grp/rep3',
							input('/root/unrelated-grp/rep3/r3-1')
						)
					)
				)
			);
			const xformDefinition = new XFormDefinition(xform.asXml());

			modelDefinition = xformDefinition.model;
		});

		/**
		 * Generally not used for testing logic, mostly to check that we're asserting
		 * expectations against the node that we think we are.
		 *
		 * Also serves as a type assertion for `node` input which might be nullish
		 * (e.g. where the node has been accessed by array index).
		 */
		const assertNodeset: AssertNodeset = (node, nodeset) => {
			expect(node?.nodeset).toBe(nodeset);
		};

		type AssertNodeset = <T extends AnyNodeDefinition>(
			node: T | undefined,
			nodeset: string
		) => asserts node is T;

		describe('controls', () => {
			it('defines the input control of a model node', () => {
				const inputNode = modelDefinition.root.children[0];

				assertNodeset(inputNode, '/root/input');

				expect(inputNode).toMatchObject({
					bodyElement: {
						category: 'control',
						type: 'input',
						reference: '/root/input',
						label: null,
						hint: null,
					},
				});
			});

			it("defines the model node's inputs label", () => {
				const labeledInputNode = modelDefinition.root.children[1];

				assertNodeset(labeledInputNode, '/root/input-label-hint');

				expect(labeledInputNode).toMatchObject({
					bodyElement: {
						category: 'control',
						type: 'input',
						reference: '/root/input-label-hint',
						label: {
							category: 'support',
							type: 'label',
							children: [{ expression: '"Label text"' }],
						},
					},
				});
			});

			it("defines the model node's input hint", () => {
				const hintedInputNode = modelDefinition.root.children[1];

				assertNodeset(hintedInputNode, '/root/input-label-hint');

				expect(hintedInputNode).toMatchObject({
					bodyElement: {
						category: 'control',
						type: 'input',
						reference: '/root/input-label-hint',
						hint: {
							category: 'support',
							type: 'hint',
							children: [{ expression: '"Hint text"' }],
						},
					},
				});
			});
		});

		describe('groups', () => {
			describe('logical groups', () => {
				it('defines the body element of a logical group for a <group> with a `ref`, but no <label>', () => {
					const logicalGroupNode = modelDefinition.root.children[2];

					assertNodeset(logicalGroupNode, '/root/loggrp');

					expect(logicalGroupNode).toMatchObject({
						bodyElement: {
							category: 'structure',
							type: 'logical-group',
							reference: '/root/loggrp',
							label: null,
						},
					});
				});

				it("defines the body elements of an unlabeled logical group's children", () => {
					const logicalGroupNode = modelDefinition.root.children[2];

					assertNodeset(logicalGroupNode, '/root/loggrp');

					expect(logicalGroupNode).toMatchObject({
						children: [
							{
								nodeset: '/root/loggrp/lg-child-1',

								bodyElement: {
									category: 'control',
									type: 'input',
									reference: '/root/loggrp/lg-child-1',
									label: null,
									hint: null,
								},
							},
							{
								nodeset: '/root/loggrp/lg-child-2',

								bodyElement: {
									category: 'control',
									type: 'input',
									reference: '/root/loggrp/lg-child-2',
									label: {
										category: 'support',
										type: 'label',
										children: [{ expression: '"Logical group child 2"' }],
									},
									hint: null,
								},
							},
						],
					});
				});

				it('defines the body element of a logical group for a <group> with a `ref` and a <label>', () => {
					const logicalGroupNode = modelDefinition.root.children[3];

					assertNodeset(logicalGroupNode, '/root/loggrp-2');

					expect(logicalGroupNode).toMatchObject({
						bodyElement: {
							category: 'structure',
							type: 'logical-group',
							reference: '/root/loggrp-2',
							label: {
								category: 'support',
								type: 'label',
								children: [{ expression: '"Logical group 2 with label"' }],
							},
						},
					});
				});

				it("defines the body elements of a labeled logical group's children", () => {
					const logicalGroupNode = modelDefinition.root.children[3];

					assertNodeset(logicalGroupNode, '/root/loggrp-2');

					expect(logicalGroupNode).toMatchObject({
						children: [
							{
								bodyElement: {
									category: 'control',
									type: 'input',
									reference: '/root/loggrp-2/lg2-1',
									label: null,
									hint: null,
								},
							},
							{
								bodyElement: {
									category: 'control',
									type: 'input',
									reference: '/root/loggrp-2/lg2-2',
									label: null,
									hint: null,
								},
							},
						],
					});
				});
			});

			describe('presentation groups', () => {
				// WE HAVE A BUG!
				//
				// Well, we have an assumption that doesn't hold, and then related to
				// that we have an actual bug which would affect end-users.
				//
				// - Assumption that doesn't hold: the targeted model element, a subtree
				//   node, has children which are referenced in the body, by inputs
				//   inside a labeled group. That group does not explicitly reference
				//   this subtree node (hence the term "presentation group", taken from
				//   the XForms spec's discussion of this kind of structure). But it's
				//   implicitly connected. It would make sense to expect the group to be
				//   implicitly associated to the model node. But it is not! (And of
				//   course it isn't; there's no direct reference associating them. This
				//   aspect is just an unhandled case.)
				//
				// - Actual bug: the group is not rendered in the view of the form. Not
				//   its structural presentation, not its label, but more troubling: not
				//   its child inputs! The root cause is that the view loop:
				//
				//      1. Reaches the node's state (currently `SubtreeState`, which
				//         corresponds to this model node's `SubtreeDefinition`)
				//      2. Finding that it has no associated body element, determines
				//         the subtree is model-only.
				//      3. Breaks recursion, thereby failing to render the child inputs.
				//
				// All of this will make its way into an issue. And while solving it is
				// well out of scope for this particular testing step in this particular
				// refactoring task, it's hard not to see the irony of finding this bug
				// in this context!
				//
				// It's **because** the design already seeks to unify body/model
				// concerns in a single structure, and **because** the view renders
				// based on that structure rather than the `BodyDefinition` structure,
				// that the erroneous assumption can cause the user-facing bug. It's
				// certainly possible to rectify the design to handle this case. But
				// it's worth considering how and whether the design can be stretched to
				// handle more significant model/body divergence. (We likely won't
				// address that beyond theory, because we likely won't encounter these
				// hypothetical cases with XLSForms. But it's an interesting insight
				// into the confounding XForms structure, and the kinds of challenges
				// we'd encounter if we tried to unify it without losing fidelity of
				// XForms semantics.)
				it.todo(
					'defines (the body element of) a presentation group for a <group> a <label> and no `ref`',
					() => {
						const presentationGroupNode = modelDefinition.root.children[4];

						assertNodeset(presentationGroupNode, '/root/presgrp');

						expect(presentationGroupNode.bodyElement).toMatchObject({
							category: 'structure',
							type: 'presentation-group',
							reference: null,
							label: {
								category: 'support',
								type: 'label',
								children: [{ expression: '"Presentation group label"' }],
							},
						});
					}
				);

				it("defines (the body elements of) a presentation group's children", () => {
					const presentationGroupNode = modelDefinition.root.children[4];

					assertNodeset(presentationGroupNode, '/root/presgrp');

					expect(presentationGroupNode).toMatchObject({
						children: [
							{
								bodyElement: {
									category: 'control',
									type: 'input',
									reference: '/root/presgrp/pg-a',
									label: null,
									hint: null,
								},
							},
							{
								bodyElement: {
									category: 'control',
									type: 'input',
									reference: '/root/presgrp/pg-b',
									label: {
										category: 'support',
										type: 'label',
										children: [{ expression: '"Presentation group child b"' }],
									},
									hint: null,
								},
							},
						],
					});
				});
			});

			describe('structural groups', () => {
				// Another expression of the issues discussed around "presentation
				// groups" above. This test cannot even be adapted from the original
				// `BodyDefinition` tests, because there's not even a subtree node to
				// associate the group with!
				//
				// It seems unlikely that this case can be produced by XLSForms either.
				it.skip('defines a structural group for a <group> with no `ref` or <label>', () => {
					const structuralGroupNode = modelDefinition.root.children[5];

					assertNodeset(structuralGroupNode, '/root/sg');

					expect(structuralGroupNode.bodyElement).toMatchObject({
						category: 'structure',
						type: 'structural-group',
						reference: null,
						label: null,
					});
				});

				// This diverges significantly from the original `BodyDefinition` test,
				// because there is no subtree node with children to test in the first
				// place. To the extent there's an intention to the original test which
				// can be preserved and has meaning, it's been preserved by matching
				// against the model nodes themselves. This means the nodes are matched
				// as children of the root, because that is their actual model
				// structure, despite incongruity with their corresponding body inputs
				// being structured in a ref-less group. As such, in order to adapt the
				// test to this model structure, the root's children array is matched
				// as an object of shape `Record<ArrayIndex, ArrayValueAtThatIndex>`.
				it("defines a structural group's children", () => {
					expect(modelDefinition.root).toMatchObject({
						children: {
							5: {
								bodyElement: {
									category: 'control',
									type: 'input',
									reference: '/root/sg-1',
									label: null,
									hint: null,
								},
							},
							6: {
								bodyElement: {
									category: 'control',
									type: 'input',
									reference: '/root/sg-2',
									label: null,
									hint: null,
								},
							},
							7: {
								bodyElement: {
									category: 'control',
									type: 'input',
									reference: '/root/sg-3',
									label: null,
									hint: null,
								},
							},
							8: {
								bodyElement: {
									category: 'control',
									type: 'input',
									reference: '/root/sg-4',
									label: null,
									hint: null,
								},
							},
							9: {
								bodyElement: {
									category: 'control',
									type: 'input',
									reference: '/root/sg-5',
									label: null,
									hint: null,
								},
							},
						},
					});
				});
			});
		});

		describe('repeats/repeat-group', () => {
			it('defines a repeat group for a node corresponding to a <group> containing a <repeat> with the same `ref`/`nodeset`', () => {
				// Note: position in the body differs from position in the model.
				const repeatGroupNode = modelDefinition.root.children[/* 6 */ 10];

				assertNodeset(repeatGroupNode, '/root/rep1');

				expect(repeatGroupNode).toMatchObject({
					bodyElement: {
						category: 'structure',
						type: 'repeat-group',
						reference: '/root/rep1',
						label: {
							category: 'support',
							type: 'label',
							children: [{ expression: '"Repeat group"' }],
						},
					},
				});
			});

			it("defines a repeat-group's repeat, distinct from general `children`", () => {
				const repeatGroupNode = modelDefinition.root.children[/* 6 */ 10];

				assertNodeset(repeatGroupNode, '/root/rep1');

				expect(repeatGroupNode).toMatchObject({
					bodyElement: {
						children: [],
						repeat: {
							category: 'structure',
							type: 'repeat',
						},
					},
				});
			});

			it("defines the body elements, of the children, of the repeat's initial first instance", () => {
				const repeatGroupNode = modelDefinition.root.children[/* 6 */ 10] as
					| RepeatSequenceDefinition
					| undefined;

				assertNodeset(repeatGroupNode, '/root/rep1');

				expect(repeatGroupNode).toMatchObject({
					instances: [
						{
							children: [
								{
									bodyElement: {
										category: 'control',
										type: 'input',
										reference: '/root/rep1/r1-1',
										label: null,
									},
								},
								{
									bodyElement: {
										category: 'control',
										type: 'input',
										reference: '/root/rep1/r1-2',
										label: {
											category: 'support',
											type: 'label',
											children: [{ expression: '"Repeat 1 input 2"' }],
										},
									},
								},
							],
						},
					],
				});
			});

			it('defines a repeat group for a <repeat> without an explicit containing <group>, for API consistency', () => {
				const inferredRepeatGroupNode = modelDefinition.root.children[/* 7 */ 11];

				assertNodeset(inferredRepeatGroupNode, '/root/rep2');

				expect(inferredRepeatGroupNode).toMatchObject({
					bodyElement: {
						category: 'structure',
						type: 'repeat-group',
						reference: '/root/rep2',
						label: null,
						children: [],
						repeat: {
							category: 'structure',
							type: 'repeat',
							children: [
								{
									category: 'control',
									type: 'input',
									reference: '/root/rep2/r2-1',
									label: null,
								},
							],
						},
					},
				});
			});

			// This test has no meaningful correlary for the model. It is testing an
			// interface specifically intended for use by the model. The specific
			// intent of that use is to build the model node/body associations under
			// test in the rest of these sub-suites.
			it.skip('gets repeat instance children by reference', () => {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				const control = bodyDefinition.getBodyElement('/root/rep1/r1-1');

				expect(control).toMatchObject({
					category: 'control',
					type: 'input',
					reference: '/root/rep1/r1-1',
					label: null,
				});
			});
		});
	});

	describe('subtrees (groups and non-groups)', () => {
		beforeEach(() => {
			const xform = html(
				head(
					title('Model definition'),
					model(
						mainInstance(
							t(
								`root id="model-definition"`,
								// prettier-ignore
								t('grp',
									t('first'),
									t('second')
								),
								// prettier-ignore
								t('sub',
									t('third'),
									t('fourth')
								)
							)
						),
						bind('/root/grp/first').type('string'),
						bind('/root/grp/second').type('string'),
						bind('/root/sub/third').type('string'),
						bind('/root/sub/fourth').type('string')
					)
				),
				// prettier-ignore
				body(
					group('/root/grp',
						input('/root/grp/first'),
						input('/root/grp/second')
					),
					input('/root/sub/third'),
					input('/root/sub/fourth')
				)
			);

			const xformDefinition = new XFormDefinition(xform.asXml());

			modelDefinition = xformDefinition.model;
		});

		it('defines a model subtree corresponding to a group', () => {
			expect(modelDefinition.root).toMatchObject({
				type: 'root',
				bind: { nodeset: '/root' },
				bodyElement: null,
				// Note: here and other cases, object with numeric keys allows
				// checking just the specific index of the array.
				children: {
					0: {
						type: 'subtree',
						bind: { nodeset: '/root/grp' },
						bodyElement: {
							type: 'logical-group',
						},
						children: [
							{
								type: 'value-node',
								bind: { nodeset: '/root/grp/first' },
								bodyElement: { type: 'input' },
							},
							{
								type: 'value-node',
								bind: { nodeset: '/root/grp/second' },
								bodyElement: { type: 'input' },
							},
						],
					},
				},
			});
		});

		it('defines a model subtree which does not correspond to a group', () => {
			expect(modelDefinition.root).toMatchObject({
				type: 'root',
				bind: { nodeset: '/root' },
				bodyElement: null,
				children: {
					1: {
						type: 'subtree',
						bind: { nodeset: '/root/sub' },
						bodyElement: null,
						children: [
							{
								type: 'value-node',
								bind: { nodeset: '/root/sub/third' },
								bodyElement: { type: 'input' },
							},
							{
								type: 'value-node',
								bind: { nodeset: '/root/sub/fourth' },
								bodyElement: { type: 'input' },
							},
						],
					},
				},
			});
		});
	});

	describe('repeat subtrees', () => {
		beforeEach(() => {
			const xform = html(
				head(
					title('Model definition'),
					model(
						mainInstance(
							// prettier-ignore
							t(`root id="model-definition"`,
								// prettier-ignore
								t('rep jr:template=""',
									t('a', 'a default'),
									t('b', 'b default')),
								// prettier-ignore
								t('rep',
									t('a'),
									t('b')
								),

								// prettier-ignore
								t('rep2',
									t('c'),
									t('d')
								),

								// prettier-ignore
								t('rep3 jr:template=""',
									t('e', 'e default')
								),

								// prettier-ignore
								t('rep4 jr:template=""',
									t('f', 'f template default')
								),
								t('rep4',
									t('f', 'default instance f 0')
								),
								t('rep4',
									t('f')
								),
								t('rep4',
									t('f', 'default instance f 2')
								),

								// prettier-ignore
								t('rep5',
									t('g', 'default instance g 0')
								),
								t('rep5',
									t('g', 'default instance g 1')
								)
							)
						),
						bind('/root/rep/a').type('string'),
						bind('/root/rep/b').type('string'),
						bind('/root/rep2/c').type('string'),
						bind('/root/rep2/d').type('string'),
						bind('/root/rep3/e').type('string'),
						bind('/root/rep4/f').type('string'),
						bind('/root/rep5/g').type('string')
					)
				),
				// prettier-ignore
				body(
					group('/root/rep',
						repeat('/root/rep',
							input('/root/rep/a'),
							input('/root/rep/b')
						)
					),
					repeat('/root/rep2',
						input('/root/rep2/c')
					),
					repeat('/root/rep3',
						input('/root/rep3/e')
					),
					repeat('/root/rep4',
						input('/root/rep4/f')
					),
					repeat('/root/rep5',
						input('/root/rep5/g')
					)
				)
			);

			const xformDefinition = new XFormDefinition(xform.asXml());

			modelDefinition = xformDefinition.model;
		});

		it.each([
			{
				index: 0,
				expected: {
					type: 'repeat-sequence',
					bind: { nodeset: '/root/rep' },
					bodyElement: {
						type: 'repeat-group',
					},
					instances: [
						{
							type: 'repeat-instance',
							bodyElement: {
								type: 'repeat',
							},
							children: [
								{
									type: 'value-node',
									bind: { nodeset: '/root/rep/a' },
									bodyElement: { type: 'input' },
								},
								{
									type: 'value-node',
									bind: { nodeset: '/root/rep/b' },
									bodyElement: { type: 'input' },
								},
							],
						},
					],
				},
			},
			{
				index: 1,
				expected: {
					type: 'repeat-sequence',
					bind: { nodeset: '/root/rep2' },
					bodyElement: {
						type: 'repeat-group',
					},
					instances: [
						{
							type: 'repeat-instance',
							bodyElement: {
								type: 'repeat',
							},
							children: [
								{
									type: 'value-node',
									bind: { nodeset: '/root/rep2/c' },
									bodyElement: { type: 'input' },
								},
								{
									type: 'value-node',
									bind: { nodeset: '/root/rep2/d' },
									bodyElement: null,
								},
							],
						},
					],
				},
			},
		])(
			'defines a model repeat/instance subtree corresponding to a body repeat (index: $index)',
			({ index, expected }) => {
				expect(modelDefinition.root).toMatchObject({
					type: 'root',
					bind: { nodeset: '/root' },
					bodyElement: null,
					children: {
						[index]: expected,
					},
				});
			}
		);

		describe('templates', () => {
			const expectRepeatTemplate = (definition: RepeatSequenceDefinition, expectedXML: string) => {
				const expected = xformsElement`${expectedXML}`;

				expectEqualNode(definition.template.node, expected);
			};

			it('defines an explicit repeat template', () => {
				const definition = modelDefinition.root.children[0] as RepeatSequenceDefinition;

				expectRepeatTemplate(definition, /* xml */ `<rep><a>a default</a><b>b default</b></rep>`);
			});

			it('derives a repeat template from a non-template instance in the form definition', () => {
				const definition = modelDefinition.root.children[1] as RepeatSequenceDefinition;

				expectRepeatTemplate(definition, /* xml */ `<rep2><c /><d /></rep2>`);
			});

			it('clears default values from a derived template', () => {
				const definition = modelDefinition.root.children[4] as RepeatSequenceDefinition;

				expectRepeatTemplate(definition, /* xml */ `<rep5><g /></rep5>`);
			});

			it.each([
				{ index: 1, expected: 1 },
				{ index: 4, expected: 2 },
			])(
				'defines $expected default instances from nodes in the form definition when a repeat template is implicitly derived',
				({ index, expected }) => {
					const definition = modelDefinition.root.children[index] as RepeatSequenceDefinition;

					expect(definition.instances.length).toBe(expected);
				}
			);

			it.fails('rejects multiple templates for the same repeat', () => {
				const xform = html(
					head(
						title('Model definition'),
						model(
							mainInstance(
								// prettier-ignore
								t(`root id="model-definition"`,
									// prettier-ignore
									t('rep',
										t('rep2 jr:template=""'),
										t('rep2',
											t('a'),
											t('b')
										)
									),
									t('rep',
										t('rep2 jr:template=""'),
										t('rep2',
											t('a'),
											t('b')
										)
									)
								)
							),
							bind('/root/rep/rep2/a').type('string'),
							bind('/root/rep/rep2/b').type('string')
						)
					),
					// prettier-ignore
					body(
						group('/root/rep',
							repeat('/root/rep',
								group('/root/rep/rep2',
									repeat('/group/rep/rep2',
										input('/root/rep/rep2/a'),
										input('/root/rep/rep2/b')
									)
								)
							)
						)
					)
				);

				expect(() => new XFormDefinition(xform.asXml())).toThrow(
					'Multiple explicit templates defined for /root/rep/rep2'
				);
			});
		});

		describe('default instances', () => {
			it.each([
				{
					nodeset: '/root/rep',
					index: 0,
					expected: 1,
				},

				{
					nodeset: '/root/rep2',
					index: 1,
					expected: 1,
				},

				// Not sure!
				// {
				// 	nodeset: '/root/rep3',
				// 	index: 0,
				// 	expected: NaN,
				// },

				{
					nodeset: '/root/rep4',
					index: 3,
					expected: 3,
				},
			])('defines $expected default instances ($nodeset)', ({ index, nodeset, expected }) => {
				const definition = modelDefinition.root.children[index] as RepeatSequenceDefinition;

				// Ensure we're testing the right sequence in the first place
				expect(definition.nodeset).toBe(nodeset);

				expect(definition.instances.length).toBe(expected);
			});

			it.each([
				{
					nodeset: '/root/rep4',
					sequenceIndex: 3,
					instanceIndex: 0,
					expectedXML: /* xml */ `<rep4><f>default instance f 0</f></rep4>`,
				},
				{
					nodeset: '/root/rep4',
					sequenceIndex: 3,
					instanceIndex: 1,
					expectedXML: /* xml */ `<rep4><f /></rep4>`,
				},
				{
					nodeset: '/root/rep4',
					sequenceIndex: 3,
					instanceIndex: 2,
					expectedXML: /* xml */ `<rep4><f>default instance f 2</f></rep4>`,
				},
			])(
				'defines the default instance for nodeset $nodeset at index $instanceIndex with default values (xml: $expectedXML)',
				({ nodeset, sequenceIndex, instanceIndex, expectedXML }) => {
					const definition = modelDefinition.root.children[
						sequenceIndex
					] as RepeatSequenceDefinition;

					// Ensure we're testing the right sequence in the first place
					expect(definition.nodeset).toBe(nodeset);

					const instance = definition.instances[instanceIndex]!;
					const expected = xformsElement`${expectedXML}`;

					expectEqualNode(instance.node, expected);
				}
			);
		});

		describe.todo('nesting');
	});
});
