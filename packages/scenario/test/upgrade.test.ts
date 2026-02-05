import { describe, expect, it } from 'vitest';
import { getNodeForReference } from '../src/client/traversal.ts';
import { Scenario } from '../src/jr/Scenario.ts';

import { JRResourceService } from '@getodk/common/jr-resources/JRResourceService.ts';
import { constants, type InstanceData } from '@getodk/xforms-engine';
const { INSTANCE_FILE_NAME, INSTANCE_FILE_TYPE } = constants;

import { XFormAttachmentFixture } from '@getodk/common/fixtures/xform-attachments.ts';
import { xmlElement } from '@getodk/common/test/fixtures/xform-dsl/index.ts';
// eslint-disable-next-line no-restricted-imports
import type { JRResourceURLString } from '@getodk/common/jr-resources/JRResourceURL.ts';
import { readdir, readFile } from 'fs/promises';

const ROOT_PATH = __dirname + '/../../../.upgrade-checker-cache';

const getFixtures = async () => {
	const result = [];

	const projects = await readdir(ROOT_PATH, { withFileTypes: true });
	for (const project of projects) {
		if (!project.isDirectory()) {
			continue;
		}
		const projectPath = `${ROOT_PATH}/${project.name}`;
		const forms = await readdir(projectPath, { withFileTypes: true });
		for (const form of forms) {
			if (!form.isDirectory()) {
				continue;
			}
			result.push(`${projectPath}/${form.name}`);
		}
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
			let url: JRResourceURLString;
			if (fixture.mimeType === 'text/csv') {
				url = `jr://file-csv/${resource.name}`;
			} else {
				url = `jr://file/${resource.name}`;
			}
			resourceService.activateResource(
				{
					fileName: resource.name,
					url,
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
		const originalValue = input.evaluate(xpath, input, null, XPathResult.STRING_TYPE).stringValue;
		if (originalValue) {
			value = `<${nodeName}>${originalValue}</${nodeName}>`;
		} else {
			value = `<${nodeName}/>`;
		}
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

const getSubmissionVersion = (submissionDocument: Document) => {
	const version = submissionDocument.evaluate(
		'/*/@version',
		submissionDocument,
		null,
		XPathResult.STRING_TYPE
	);
	return version.stringValue;
};

const getFormVersion = (formDocument: Document) => {
	const version = formDocument.evaluate(
		'//instance[1]/*[@id]/@version',
		formDocument,
		null,
		XPathResult.STRING_TYPE
	);
	return version.stringValue;
};

const getActionReferences = (formDocument: Document) => {
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
		const relativeFormPath = formPath.substring(ROOT_PATH.length);
		describe(`form ${relativeFormPath}`, async () => {
			const formXml = await readFile(formPath, { encoding: 'utf8' });
			const form = xmlElement(formXml);
			const formDocument = parser.parseFromString(formXml, 'text/xml');
			const formVersion = getFormVersion(formDocument);
			const actionRefs = getActionReferences(formDocument);

			const resourceService = await initResourceService(fixture);

			const submissions = await findSubmissions(fixture);

			for (const submission of submissions) {
				const relativeSubmissionPath = submission.substring(ROOT_PATH.length);
				const submissionXml = await readFile(submission, { encoding: 'utf8' });

				const inputDocument = parser.parseFromString(submissionXml, 'text/xml');
				const submissionVersion = getSubmissionVersion(inputDocument);
				if (submissionVersion !== formVersion) {
					console.log(
						`ignoring ${relativeSubmissionPath} it was submitted with a different form version`
					);
					continue;
				}
				it(`can edit submission ${relativeSubmissionPath}`, async () => {
					const instanceXML = `<?xml version="1.0" encoding="UTF-8"?> ${submissionXml}`;
					const instanceFile = new File([instanceXML], INSTANCE_FILE_NAME, {
						type: INSTANCE_FILE_TYPE,
					});
					const instanceData = new FormData();
					instanceData.set(INSTANCE_FILE_NAME, instanceFile);
					const scenario = await Scenario.init('upgrade form', form, {
						resourceService,
						editInstance: {
							inputType: 'FORM_INSTANCE_INPUT_RESOLVED',
							data: [instanceData as InstanceData],
						},
					});
					mockXML(inputDocument, scenario, '/data/meta/instanceID', 'clone');
					mockXML(inputDocument, scenario, '/data/meta/deprecatedID', 'delete');

					actionRefs.forEach((ref) => {
						mockXML(inputDocument, scenario, ref, 'clone');
					});

					const editedResult = scenario.proposed_serializeInstance();
					expect(editedResult).toBe(submissionXml);
				});
			}
		});
	}
});
