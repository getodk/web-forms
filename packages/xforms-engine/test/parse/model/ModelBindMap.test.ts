import {
	bind,
	body,
	head,
	html,
	mainInstance,
	model,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl';
import { beforeEach, describe, expect, it } from 'vitest';
import { BindDefinition } from '../../../src/parse/model/BindDefinition.ts';
import type { ModelBindMap } from '../../../src/parse/model/ModelBindMap.ts';
import { XFormDefinition } from '../../../src/parse/XFormDefinition.ts';
import { XFormDOM } from '../../../src/parse/XFormDOM.ts';

describe('ModelBindMap', () => {
	let binds: ModelBindMap;

	beforeEach(() => {
		const xform = html(
			head(
				title('Bind types'),
				model(
					mainInstance(
						t(
							'root id="bind-types"',
							t(
								'group',
								t('first-question'),
								t(
									'sub-group',
									// Preserve indentation
									t(
										'deep-group',
										// ...
										t('second-question')
									)
								),
								t('third-question')
							)
						)
					),
					bind('/root/group/first-question').calculate('/root/group/third-question * 2'),
					bind('/root/group/sub-group/deep-group').relevant('/root/group/first-question != 10'),
					bind('/root/group/sub-group/deep-group/second-question').relevant(
						'/root/group/third-question != 10'
					),
					bind('/root/group/third-question').type('int')
				)
			),
			body()
		);
		const xformDOM = XFormDOM.from(xform.asXml());
		const form = new XFormDefinition(xformDOM);

		binds = form.model.binds;
	});

	it('includes parent nodesets without explicit binds (for ancestor relevance)', () => {
		expect(binds.get('/root/group')).toBeInstanceOf(BindDefinition);
		expect(binds.get('/root/group/sub-group')).toBeInstanceOf(BindDefinition);
	});
});
