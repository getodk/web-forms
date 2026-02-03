import { describe, expect, it } from 'vitest';
import { getNodeForReference } from '../src/client/traversal.ts';
import { Scenario } from '../src/jr/Scenario.ts';

import { JRResourceService } from '@getodk/common/jr-resources/JRResourceService.ts';
import { constants, type InstanceData } from '@getodk/xforms-engine';
const { INSTANCE_FILE_NAME, INSTANCE_FILE_TYPE } = constants;

import { XFormAttachmentFixture } from '@getodk/common/fixtures/xform-attachments.ts';
import { xmlElement } from '@getodk/common/test/fixtures/xform-dsl/index.ts';
// eslint-disable-next-line no-restricted-imports
import { readdir, readFile } from 'fs/promises';

// ~/src/getodk/web-forms/packages/scenario$ npx vitest test/upgrade.test.ts --silent=false

const getFixtures = async () => {
	const result = [];
	const source = __dirname + '/upgrade';

	const dirs = await readdir(source, { withFileTypes: true });
	for (const dir of dirs) {
		if (!dir.isDirectory()) {
			continue;
		}
		result.push(`${source}/${dir.name}`);
	}
	return result;
};

const initResourceService = async (fixturePath: string) => {
	const resourceService = new JRResourceService();
	const resourcePath = `${fixturePath}/resources`;
	try {
		const resources = await readdir(resourcePath, { withFileTypes: true });
		for (const resource of resources) {
			const resourceContent = await readFile(`${resourcePath}/${resource.name}`, {
				encoding: 'utf8',
			});
			const fixture = new XFormAttachmentFixture(`${resourcePath}/${resource.name}`, () =>
				Promise.resolve('fake')
			);
			resourceService.activateResource(
				{
					fileName: resource.name,
					url: `jr://file/${resource.name}`,
					mimeType: fixture.mimeType,
				},
				resourceContent
			);
		}
	} catch {
		// no resources found
	}
	return resourceService;
};

const findSubmissions = async (fixturePath: string) => {
	const submissionDirName = `${fixturePath}/submissions`;
	return (await readdir(submissionDirName, { withFileTypes: true })).map(
		(file) => `${submissionDirName}/${file.name}`
	);
};

type MockAction = 'clear' | 'clone' | 'delete';

const mockXML = (input: Document, edited: Scenario, xpath: string, action: MockAction) => {
	const editedNode = getNodeForReference(edited.instanceRoot, xpath);
	if (!editedNode) {
		if (action === 'delete') {
			return;
		} else {
			throw new Error(`Node ${xpath} not found`);
		}
	}
	const nodeName = editedNode.definition.qualifiedName.localName;
	let value;
	if (action === 'clone') {
		const originalValue = input.evaluate(xpath, input, null, XPathResult.STRING_TYPE);
		value = `<${nodeName}>${originalValue.stringValue}</${nodeName}>`;
	} else if (action === 'delete') {
		value = '';
	} else {
		value = `<${nodeName}/>`;
	}
	Object.defineProperty(editedNode.instanceState, 'instanceXML', {
		value,
		writable: false,
	});
};

const getActionReferences = (parser: DOMParser, formXml: string) => {
	const formDocument = parser.parseFromString(formXml, 'text/xml');
	const actions = formDocument.evaluate(
		'//*[@event]',
		formDocument,
		null,
		XPathResult.ORDERED_NODE_ITERATOR_TYPE
	);
	let action;
	const refs: string[] = [];
	while ((action = actions.iterateNext() as Element) !== null) {
		const event = action.getAttribute('event');
		const ref = action.getAttribute('ref');
		if (event && ref && event.includes('odk-instance-load')) {
			refs.push(ref);
		}
	}
	return refs;
};

describe('Upgrade test', async () => {
	const fixtures = await getFixtures();
	const parser = new DOMParser();

	for (const fixture of fixtures) {
		const formPath = `${fixture}/form.xml`;
		describe(`form ${formPath}`, async () => {
			const formXml = await readFile(formPath, { encoding: 'utf8' });
			const form = xmlElement(formXml);
			const actionRefs = getActionReferences(parser, formXml);

			const resourceService = await initResourceService(fixture);

			const submissions = await findSubmissions(fixture);

			for (const submission of submissions) {
				it(`can edit submission ${submission}`, async () => {
					const submissionXml = await readFile(submission, { encoding: 'utf8' });

					const inputDocument = parser.parseFromString(submissionXml, 'text/xml');

					const originalScenario = await Scenario.init('upgrade form', form, { resourceService });
					const instanceXML = `<?xml version="1.0" encoding="UTF-8"?> ${submissionXml}`;
					const instanceFile = new File([instanceXML], INSTANCE_FILE_NAME, {
						type: INSTANCE_FILE_TYPE,
					});
					const instanceData = new FormData();
					instanceData.set(INSTANCE_FILE_NAME, instanceFile);
					const editedScenario = await originalScenario.editWebFormsInstanceState({
						inputType: 'FORM_INSTANCE_INPUT_RESOLVED',
						data: [instanceData as InstanceData],
					});
					mockXML(inputDocument, editedScenario, '/data/meta/instanceID', 'clone');
					mockXML(inputDocument, editedScenario, '/data/meta/deprecatedID', 'delete');

					actionRefs.forEach((ref) => {
						mockXML(inputDocument, editedScenario, ref, 'clone');
					});

					const editedResult = editedScenario.proposed_serializeInstance();
					expect(editedResult).toBe(submissionXml);
				});
			}
		});
	}
});
