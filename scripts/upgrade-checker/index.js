/* eslint-disable */
// @ts-nocheck

import { input, password } from '@inquirer/prompts';
import { mkdir, writeFile } from 'fs/promises';

const SESSIONS_API = '/v1/sessions';
const PROJECTS_API = '/v1/projects';

const OUTPUT_DIR = import.meta.dirname + '/../../.upgrade-checker-cache/';

const request = async (options) => {
	const { server, path, method = 'GET', body, token, params, headers = {} } = options;
	let url = server + path;
	if (params) {
		const queryString = new URLSearchParams(params).toString();
		url += '?' + queryString;
	}
	console.log(`request: ${url}`);
	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}
	const response = await fetch(url, {
		method,
		headers,
		body: body && JSON.stringify(body),
	});
	if (!response.ok) {
		const text = await response.text();
		throw new Error(`HTTP error status: ${response.status} ${text}`);
	}
	return response;
};

const jsonRequest = async (options) => {
	options.headers = {
		Accept: 'application/json',
		'Content-Type': 'application/json',
	};
	const response = await request(options);
	return await response.json();
};

const xmlRequest = async (options) => {
	options.headers = {
		Accept: 'application/xml',
		'Content-Type': 'application/xml',
	};
	const response = await request(options);
	return await response.text();
};

const auth = async (server, email, pass) => {
	const data = await jsonRequest({
		server,
		path: SESSIONS_API,
		method: 'POST',
		body: { email, password: pass },
	});
	return data.token;
};

const getProjects = async (server, token) => {
	return await jsonRequest({
		server,
		path: PROJECTS_API,
		token,
		params: { forms: true },
	});
};

const getFormXml = async (server, token, form) => {
	encodeURIComponent();
	const path = `/v1/projects/${encodeURIComponent(form.projectId)}/forms/${encodeURIComponent(form.xmlFormId)}.xml`;
	return xmlRequest({ server, token, path });
};

const getAttachments = async (server, token, form) => {
	const path = `/v1/projects/${encodeURIComponent(form.projectId)}/forms/${encodeURIComponent(form.xmlFormId)}/attachments`;
	return await jsonRequest({
		server,
		token,
		path,
	});
};

const getAttachmentFile = async (server, token, form, attachment) => {
	const path = `/v1/projects/${encodeURIComponent(form.projectId)}/forms/${encodeURIComponent(form.xmlFormId)}/attachments/${encodeURIComponent(attachment.name)}`;
	const response = await request({
		server,
		token,
		path,
	});
	return await response.text();
};

const getSubmissions = async (server, token, form) => {
	const path = `/v1/projects/${encodeURIComponent(form.projectId)}/forms/${encodeURIComponent(form.xmlFormId)}/submissions`;
	return await jsonRequest({
		server,
		token,
		path,
	});
};

const getSubmissionFile = async (server, token, form, submission) => {
	const path = `/v1/projects/${encodeURIComponent(form.projectId)}/forms/${encodeURIComponent(form.xmlFormId)}/submissions/${encodeURIComponent(submission.instanceId)}.xml`;
	return xmlRequest({ server, token, path });
};

const writeFormXml = async (server, token, formDir, form) => {
	const fileXml = await getFormXml(server, token, form);
	await mkdir(formDir);
	const filename = `${formDir}/form.xml`;
	await writeFile(filename, fileXml, 'utf8');
};

const writeAttachmentFiles = async (server, token, formDir, form) => {
	const dir = formDir + '/resources';
	await mkdir(dir);
	const attachments = await getAttachments(server, token, form);
	for (const attachment of attachments) {
		if (attachment.exists) {
			const attachmentFile = await getAttachmentFile(server, token, form, attachment);
			const filename = `${dir}/${attachment.name}`;
			await writeFile(filename, attachmentFile, 'utf8');
		}
	}
};

const writeSubmissionFiles = async (server, token, formDir, form) => {
	const dir = formDir + '/submissions';
	await mkdir(dir);
	const submissions = await getSubmissions(server, token, form);
	submissions.sort((lhs, rhs) => new Date(rhs.createdAt) - new Date(lhs.createdAt)); // reverse sort, newest first
	const subset = submissions.slice(0, 100); // pick the most recent 100
	for (const submission of subset) {
		const submissionXml = await getSubmissionFile(server, token, form, submission);
		const filename = `${dir}/${submission.instanceId}.xml`;
		await writeFile(filename, submissionXml, 'utf8');
	}
};

const escapeFileName = (fileName) => fileName.replaceAll('/', '-slash-').substring(0, 100);

try {
	await mkdir(OUTPUT_DIR);
} catch {
	throw new Error(
		`Error making the output dir. If this directory already exists, delete it and try again: ${OUTPUT_DIR}`
	);
}

const server = await input({
	message:
		'Central instance to check? Enter the URL without a trailing "/", eg: "https://dev.getodk.cloud"',
});
const email = await input({ message: 'Email login?' });
const pass = await password({ message: 'Password?' });

console.log('logging in');
const token = await auth(server, email, pass);

console.log('getting projects');
const projects = await getProjects(server, token);

const PROJECTS_TO_SKIP = [];

for (const project of projects) {
	if (project.archived) {
		console.log(`Skipping archived project ${project.name}`);
		continue;
	}
	if (PROJECTS_TO_SKIP.includes(project.name)) {
		console.log(`Skipping ${project.name}`);
		continue;
	}
	const projectDir = OUTPUT_DIR + escapeFileName(project.name);
	await mkdir(projectDir);
	for (const form of project.formList) {
		const formDir = projectDir + '/' + escapeFileName(form.xmlFormId);
		console.log(`----- getting form ${project.name} ${form.name}`);
		await writeFormXml(server, token, formDir, form);
		await writeAttachmentFiles(server, token, formDir, form);
		await writeSubmissionFiles(server, token, formDir, form);
	}
}
