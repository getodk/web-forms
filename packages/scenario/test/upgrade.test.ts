import { getNodeForReference } from '../src/client/traversal.ts';
import { Scenario } from '../src/jr/Scenario.ts';

import { JRResourceService } from '@getodk/common/jr-resources/JRResourceService.ts';

import { XFormAttachmentFixture } from '@getodk/common/fixtures/xform-attachments.ts';
import type { JRResourceURLString } from '@getodk/common/jr-resources/JRResourceURL.ts';
import { xmlElement } from '@getodk/common/test/fixtures/xform-dsl/index.ts';
// eslint-disable-next-line no-restricted-imports
import { readdir, readFile } from 'fs/promises';
import { expect, it } from 'vitest';

const ROOT_PATH = __dirname + '/../../../.upgrade-checker-cache';

const getServers = async () => {
	const servers = await readdir(ROOT_PATH, { withFileTypes: true });
	return servers.filter((server) => server.isDirectory()).map((dir) => dir.name);
};

const getProjects = async (server: string) => {
	const path = `${ROOT_PATH}/${server}`;
	const projects = await readdir(path, { withFileTypes: true });
	return projects.filter((project) => project.isDirectory()).map((dir) => dir.name);
};

const getForms = async (server: string, project: string) => {
	const path = `${ROOT_PATH}/${server}/${project}`;
	const forms = await readdir(path, { withFileTypes: true });
	return forms.filter((form) => form.isDirectory()).map((dir) => dir.name);
};

const initResourceService = async (fixturePath: string) => {
	const resourceService = new JRResourceService();
	const resourcePath = `${fixturePath}/resources`;
	try {
		const resources = await readdir(resourcePath, { withFileTypes: true });
		if (resources.length > 100) {
			throw new Error('Too many resources');
		}
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

const mockXML = (input: Document, edited: Scenario, xpath: string) => {
	const editedNode = getNodeForReference(edited.instanceRoot, xpath);
	if (!editedNode) {
		return;
	}
	const nodeName = editedNode.definition.qualifiedName.localName;
	let value;
	const count = input.evaluate(
		'count(' + xpath + ')',
		input,
		null,
		XPathResult.NUMBER_TYPE
	).numberValue;
	if (count === 0) {
		value = '';
	} else {
		const originalValue = input.evaluate(xpath, input, null, XPathResult.STRING_TYPE).stringValue;
		if (originalValue) {
			value = `<${nodeName}>${originalValue}</${nodeName}>`;
		} else {
			value = `<${nodeName}/>`;
		}
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

const isEncrypted = (submissionDocument: Document) => {
	const encrypted = submissionDocument.evaluate(
		'/*/@encrypted',
		submissionDocument,
		null,
		XPathResult.BOOLEAN_TYPE
	);
	return encrypted.booleanValue;
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

const getUnstableCalculations = (formDocument: Document) => {
	const binds = formDocument.evaluate(
		'//bind[@calculate="now()"] | //bind[@calculate="today()"] | //bind[@calculate="uuid()"]',
		formDocument,
		null,
		XPathResult.ORDERED_NODE_ITERATOR_TYPE
	);
	let action;
	const refs: string[] = [];
	while ((action = binds.iterateNext() as Element) !== null) {
		const ref = action.getAttribute('nodeset');
		if (ref) {
			refs.push(ref);
		}
	}
	return refs;
};

const xmlCleanup = (xml: string) => {
	const parser = new DOMParser();
	const doc = parser.parseFromString(xml, 'text/xml');
	const formatted = new XMLSerializer().serializeToString(doc);
	return formatted.replaceAll(/>\s+</g, '><').replaceAll(/ xmlns:[a-zA-Z]+="[^"]+"/g, '');
};

const getFixtures = async () => {
	const result = [];
	const servers = await getServers();
	for (const server of servers) {
		const projects = await getProjects(server);
		for (const project of projects) {
			const forms = await getForms(server, project);
			for (const formDir of forms) {
				result.push({ server, project, formDir });
			}
		}
	}
	return result;
};

const parser = new DOMParser();
const fixtures = await getFixtures();

// eslint-disable-next-line no-console
console.log(`found ${fixtures.length} fixtures`);

for (const fixture of fixtures) {
	it(`server: ${fixture.server} > project: ${fixture.project} > form: ${fixture.formDir}`, async () => {
		const { server, project, formDir } = fixture;
		const fixturePath = `${ROOT_PATH}/${server}/${project}/${formDir}`;

		const submissions = await findSubmissions(fixturePath);
		if (submissions.length === 0) {
			// eslint-disable-next-line no-console
			console.log(`SKIP : no submissions found for form ${formDir}`);
			return;
		}
		const formPath = `${fixturePath}/form.xml`;
		const formXml = await readFile(formPath, { encoding: 'utf8' });
		const form = xmlElement(formXml);
		const formDocument = parser.parseFromString(formXml, 'text/xml');
		const formVersion = getFormVersion(formDocument);
		const actionRefs = getActionReferences(formDocument);
		const binds = getUnstableCalculations(formDocument);
		const resourceService = await initResourceService(fixturePath);

		for (const submission of submissions) {
			const relativeSubmissionPath = submission.substring(fixturePath.length);
			const testName = `server: ${server} > project: ${project} > form: ${formDir} > submission: ${relativeSubmissionPath}`;
			// eslint-disable-next-line no-console
			console.log('running', testName);

			const submissionXml = await readFile(submission, { encoding: 'utf8' });

			const inputDocument = parser.parseFromString(submissionXml, 'text/xml');
			const submissionVersion = getSubmissionVersion(inputDocument);
			if (submissionVersion !== formVersion) {
				// eslint-disable-next-line no-console
				console.log('SKIP : it was submitted with a different form version');
				continue;
			}
			const encrypted = isEncrypted(inputDocument);
			if (encrypted) {
				// eslint-disable-next-line no-console
				console.log('SKIP : because it is encrypted');
				continue;
			}

			const scenario = await Scenario.init('upgrade form', form, {
				resourceService,
				editInstance: submissionXml,
			});
			const rootNodeset = scenario.instanceRoot.definition.nodeset;
			mockXML(inputDocument, scenario, rootNodeset + '/meta/instanceID');
			mockXML(inputDocument, scenario, rootNodeset + '/meta/deprecatedID');

			actionRefs.forEach((ref) => {
				mockXML(inputDocument, scenario, ref);
			});
			binds.forEach((ref) => {
				mockXML(inputDocument, scenario, ref);
			});

			const editedResult = scenario.proposed_serializeInstance();

			const edited = xmlCleanup(editedResult);
			const original = xmlCleanup(submissionXml);
			expect(edited).to.equal(original);
		}
	});
}
