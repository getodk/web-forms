import {
	bind,
	body,
	head,
	html,
	mainInstance,
	model,
	t,
	title,
	upload,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import type { UploadNode } from '@getodk/xforms-engine';
import { assert, beforeEach, describe, expect, it } from 'vitest';
import { binaryAnswer } from '../../src/answer/ExpectedBinaryAnswer.ts';
import { Scenario } from '../../src/jr/Scenario.ts';

describe('Instance attachments: upload controls', () => {
	const FAKE_INSTANCE_ID = 'not important to this suite';

	describe('basic upload state', () => {
		let scenario: Scenario;

		beforeEach(async () => {
			scenario = await Scenario.init(
				'Basic upload control',
				// prettier-ignore
				html(
					head(
						title('Basic upload control'),
						model(
							mainInstance(
								t('data id="basic-upload-control"',
									t('file-upload'),
									t('meta',
										t('instanceID', FAKE_INSTANCE_ID)))),
							bind('/data/file-upload').type('binary'))),
					body(
						upload('/data/file-upload')))
			);
		});

		// This suite is effectively testing the assertion exension itself, to ensure
		// real assertions are meaningful for all of the cases it covers.
		describe('(`toEqualUploadedAnswer` assertion extension sanity checks)', () => {
			const actualFileName = 'sanity-check.txt';
			const actualFileType = 'text/plain';
			const actualFileData = 'Sanity check!';

			const uploadValue = new File([actualFileData], actualFileName, {
				type: actualFileType,
			});

			it('does not equal with different file name', async () => {
				scenario.answer('/data/file-upload', uploadValue);

				await expect(scenario.answerOf('/data/file-upload')).not.toEqualUploadedAnswer(
					binaryAnswer(
						new File([actualFileData], `other_${actualFileName}`, {
							type: actualFileType,
						})
					)
				);
			});

			it('does not equal with different file type', async () => {
				scenario.answer('/data/file-upload', uploadValue);

				await expect(scenario.answerOf('/data/file-upload')).not.toEqualUploadedAnswer(
					binaryAnswer(
						new File([actualFileData], actualFileName, {
							type: `${actualFileType}-other`,
						})
					)
				);
			});

			it('does not equal with different file data', async () => {
				scenario.answer('/data/file-upload', uploadValue);

				await expect(scenario.answerOf('/data/file-upload')).not.toEqualUploadedAnswer(
					binaryAnswer(
						new File([`${actualFileData} OTHER`], actualFileName, {
							type: actualFileData,
						})
					)
				);
			});

			it('does not equal a blank file', async () => {
				scenario.answer('/data/file-upload', uploadValue);

				await expect(scenario.answerOf('/data/file-upload')).not.toEqualUploadedAnswer(
					binaryAnswer(null)
				);
			});

			it('does not equal a file when value is blank', async () => {
				scenario.answer('/data/file-upload', null);

				await expect(scenario.answerOf('/data/file-upload')).not.toEqualUploadedAnswer(
					binaryAnswer(uploadValue)
				);
			});
		});

		it('assigns an uploaded file value', async () => {
			const uploadValue = new File(
				['Uploading an instance attachment!', 'This is its text contents!'],
				'upload.txt',
				{ type: 'text/plain' }
			);

			scenario.answer('/data/file-upload', uploadValue);

			await expect(scenario.answerOf('/data/file-upload')).toEqualUploadedAnswer(
				binaryAnswer(uploadValue)
			);
		});

		it('includes an uploaded file name in serialized instance XML', () => {
			const uploadName = 'upload.txt';
			const uploadValue = new File(['Not important'], uploadName, {
				type: 'text/plain',
			});

			scenario.answer('/data/file-upload', uploadValue);

			expect(scenario).toHaveSerializedSubmissionXML(
				// prettier-ignore
				t('data id="basic-upload-control"',
					t('file-upload', uploadName),
					t('meta',
						t('instanceID', FAKE_INSTANCE_ID))).asXml()
			);
		});
	});

	describe('accepted types', () => {
		const getUploadNode = (scneario: Scenario, reference: string): UploadNode => {
			const node = scneario.getInstanceNode(reference);

			assert(node.nodeType === 'upload');

			return node;
		};

		type UploadAcceptedTypeCaseAttrs =
			| ReadonlyMap<'accept', string>
			| ReadonlyMap<'mediatype', string>
			| ReadonlyMap<never, string>;

		interface AcceptedTypeCase {
			readonly description: string;
			readonly uploadAttrs: UploadAcceptedTypeCaseAttrs;
			readonly expected: readonly [string, ...string[]];
		}

		it.each<AcceptedTypeCase>([
			{
				description: 'parses an accepted type accepting all uploads by default',
				uploadAttrs: new Map(),
				expected: ['*/*'],
			},

			{
				description: 'parses a single `mediatype` MIME type value',
				uploadAttrs: new Map([['mediatype', 'image/*']]),
				expected: ['image/*'],
			},

			{
				description: 'parses multiple `accept` MIME type values',
				uploadAttrs: new Map([['accept', 'audio/*, video/*']]),
				expected: ['audio/*', 'video/*'],
			},

			{
				description: 'parses multiple `accept` extension values',
				uploadAttrs: new Map([['accept', '.gif, .jpg, .png']]),
				expected: ['.gif', '.jpg', '.png'],
			},

			{
				description: 'parses a mix of `accept` MIME type and extension values',
				uploadAttrs: new Map([['accept', '.gif, .jpg, .png, video/*']]),
				expected: ['.gif', '.jpg', '.png', 'video/*'],
			},
		])('$description', async ({ uploadAttrs, expected }) => {
			const scenario = await Scenario.init(
				'Typed upload control',
				// prettier-ignore
				html(
					head(
						title('Typed upload control'),
						model(
							mainInstance(
								t('data id="typed-upload-control"',
									t('file-upload'),
									t('meta',
										t('instanceID', FAKE_INSTANCE_ID)))),
							bind('/data/file-upload').type('binary'))),
					body(
						upload('/data/file-upload', uploadAttrs)))
			);

			const node = getUploadNode(scenario, '/data/file-upload');

			expect(node.nodeOptions.types).toEqual(expected);
		});

		interface InvalidAcceptedTypeCase {
			readonly description: string;
			readonly uploadAttrs: UploadAcceptedTypeCaseAttrs;
		}

		it.each<InvalidAcceptedTypeCase>([
			{
				description: 'does not parse a `mediatype` attribute specifying a file extension',
				uploadAttrs: new Map([['mediatype', '.jpg']]),
			},

			{
				description: 'does not parse a blank `mediatype` attribute',
				uploadAttrs: new Map([['mediatype', '']]),
			},

			{
				description: 'does not parse a blank `accept` attribute',
				uploadAttrs: new Map([['accept', '']]),
			},

			{
				description: 'does not parse an arbitrary `accept` value',
				uploadAttrs: new Map([['accept', 'arbitrary']]),
			},
		])('$description', async ({ uploadAttrs }) => {
			const init = async () => {
				await Scenario.init(
					'Invalid upload control',
					// prettier-ignore
					html(
						head(
							title('Invalid upload control'),
							model(
								mainInstance(
									t('data id="invalid-upload-control"',
										t('file-upload'),
										t('meta',
											t('instanceID', FAKE_INSTANCE_ID)))),
								bind('/data/file-upload').type('binary'))),
						body(
							upload('/data/file-upload', uploadAttrs)))
				);
			};

			await expect(init).rejects.toThrow();
		});
	});
});
