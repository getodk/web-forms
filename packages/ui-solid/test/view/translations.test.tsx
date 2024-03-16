import {
	bind,
	body,
	head,
	html,
	input,
	mainInstance,
	model,
	t,
	title,
} from '@odk-web-forms/common/test/fixtures/xform-dsl/index.ts';
import { EntryState, XFormDefinition } from '@odk-web-forms/xforms-engine';
// import { render } from '@solidjs/testing-library';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from '../../src/App.tsx';

describe('XFormView', () => {
	let rootElement: Element;
	let dispose: VoidFunction | null;

	const xform = html(
		head(
			title('Itext (basic)'),
			model(
				// prettier-ignore
				t('itext',
					t('translation lang="English"',
						t('text id="q1:label"',
							t('value', '1. Question one')
						)
					),
					t('translation lang="Español"',
						t('text id="q1:label"',
							t('value', '1. Pregunta uno')
						)
					)
				),
				mainInstance(t('root id="itext-basic"', t('q1'), t('meta', t('instanceID')))),
				bind('/root/q1')
			)
		),
		body(input('/root/q1', t(`label ref="jr:itext('q1:label')"`)))
	);

	let xformDefinition: XFormDefinition;

	beforeEach(() => {
		xformDefinition = new XFormDefinition(xform.asXml());
		rootElement = document.createElement('div');
		dispose = null;
	});

	afterEach(() => {
		dispose?.();
	});

	it('renders a label in the default language', () => {
		dispose = render(() => {
			const entry = new EntryState(xformDefinition);

			return <App entry={entry} />;
		}, rootElement);

		const label = Array.from(rootElement.querySelectorAll('label')).find((element) => {
			return element.textContent?.startsWith('1.');
		});

		expect(label).not.toBeUndefined();
		expect(label!.textContent).toBe('1. Question one');
	});

	it.todo('translates the label to another language', () => {
		let entry!: EntryState;

		dispose = render(() => {
			entry = new EntryState(xformDefinition);

			return <App entry={entry} />;
		}, rootElement);

		// TODO: the intent was actually to test this by selecting the menu item,
		// but resolving the menu item proved difficult. Probably better as an
		// e2e test?
		entry.translations!.setActiveLanguage('Español');

		const label = Array.from(rootElement.querySelectorAll('label')).find((element) => {
			return element.textContent?.startsWith('1.');
		});

		expect(label).not.toBeUndefined();
		expect(label!.textContent).toBe('1. Pregunta uno');
	});
});