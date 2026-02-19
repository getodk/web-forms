import { getNodeForReference } from '../src/client/traversal.ts';
import { Scenario } from '../src/jr/Scenario.ts';

import { JRResourceService } from '@getodk/common/jr-resources/JRResourceService.ts';

import { XFormAttachmentFixture } from '@getodk/common/fixtures/xform-attachments.ts';
import type { JRResourceURLString } from '@getodk/common/jr-resources/JRResourceURL.ts';
import { xmlElement } from '@getodk/common/test/fixtures/xform-dsl/index.ts';
// eslint-disable-next-line no-restricted-imports
import { readdir, readFile, stat } from 'fs/promises';
import { expect, it } from 'vitest';

const ROOT_PATH = __dirname + '/../../../.upgrade-checker-cache';
const parser = new DOMParser();

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
	resourceService.activateResource(
		{
			fileName: 'last-saved',
			url: 'jr://instance/last-saved',
			mimeType: 'text/xml',
		},
		'<root/>'
	);
	const resourcePath = `${fixturePath}/resources`;
	let resources;
	try {
		resources = await readdir(resourcePath);
	} catch {
		// no resources found
		return resourceService;
	}
	if (resources.length > 100) {
		throw new Error('Too many resources in ' + resourcePath);
	}
	for (const resource of resources) {
		const filename = `${resourcePath}/${resource}`;
		const fixture = new XFormAttachmentFixture(filename, () => Promise.resolve('fake'));
		let url: JRResourceURLString;
		if (fixture.mimeType === 'text/csv') {
			url = `jr://file-csv/${resource}`;
		} else {
			url = `jr://file/${resource}`;
		}
		let resourceContent;
		if (resource.endsWith('.csv') || resource.endsWith('.geojson') || resource.endsWith('.xml')) {
			const stats = await stat(filename);
			if (stats.size > 100_000) {
				// 100kb
				throw new Error(`Resource too large to load: ${filename}`);
			}
			resourceContent = await readFile(filename, {
				encoding: 'utf8',
			});
		} else {
			resourceContent = '<blank>';
		}
		resourceService.activateResource(
			{
				fileName: resource,
				url,
				mimeType: fixture.mimeType,
			},
			resourceContent
		);
	}
	return resourceService;
};

const findSubmissions = async (fixturePath: string) => {
	const submissionDirName = `${fixturePath}/submissions`;
	const files = await readdir(submissionDirName);
	return files.slice(0, 10).map((file) => `${submissionDirName}/${file}`);
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
		'//bind[@calculate="now()"] | //bind[@calculate="today()"] | //bind[@calculate="uuid()"] | //bind[@calculate="random()"]',
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
	const doc = parser.parseFromString(xml, 'text/xml');
	const formatted = new XMLSerializer().serializeToString(doc);
	return formatted
		.replaceAll(/>\s+</g, '><') // remove whitespace between tags
		.replaceAll(/ xmlns:[a-zA-Z]+="[^"]+"/g, '') // remove namespace declarations
		.replaceAll(/<orx:/g, '<') // remove namespace usages
		.replaceAll(/<\/orx:/g, '</'); // remove namespace usages (closing tags)
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

const fixtures = await getFixtures();

for (const fixture of fixtures) {
	const { server, project, formDir } = fixture;
	const testName = `server: ${server} > project: ${project} > form: ${formDir}`;
	it(testName, async () => {
		// eslint-disable-next-line no-console
		console.log('~~~~~~~~~~~ running test', testName);
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
