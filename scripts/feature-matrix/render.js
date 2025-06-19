/* eslint-disable */
// @ts-nocheck

import Mustache from 'mustache';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const rootUrl = new URL('../..', import.meta.url);
const featureMatrix = JSON.parse(
	await fs.readFile(new URL('./feature-matrix.json', rootUrl), 'utf-8')
);
const template = await fs.readFile(
	new URL('scripts/feature-matrix/template.mustache', rootUrl),
	'utf-8'
);
const readmeFile = await fs.readFile(new URL('./README.md', rootUrl), 'utf-8');

// Modified version of https://gist.github.com/rougier/c0d31f5cbdaac27b876c?permalink_comment_id=2269298#gistcomment-2269298
const progress = (fraction) => {
	const totalLength = 15;
	const barLength = Math.floor(fraction * totalLength);
	const bar = Array(barLength).fill('🟩').join('');
	const remaining = Array(totalLength - barLength)
		.fill('⬜')
		.join('');
	return `${bar}${remaining} ${Math.floor(fraction * 100)}\\%`;
};

// Not so smart, blindly breaks the word. Okay for now.
const wrapString = (str, maxLength) => {
	let parts = [];
	for (let i = 0; i < str.length; i += maxLength) {
		parts.push(str.slice(i, i + maxLength));
	}
	return parts.join('<br/>');
};

// Transform feature-matrix.json object into array
const featureCategories = Object.keys(featureMatrix).map((featureCategory) => {
	const features = Object.keys(featureMatrix[featureCategory]).map((feature) => {
		return {
			label: wrapString(feature.replaceAll('|', '\\|'), 40),
			status: featureMatrix[featureCategory][feature],
		};
	});

	// no points for 🚧
	const progressFraction = features.filter((f) => f.status === '✅').length / features.length;

	return {
		label: `##### ${featureCategory}<br/>${progress(progressFraction)}`,
		features,
	};
});

const featureMatrixMd = Mustache.render(template, { categories: featureCategories });

const autogenOpen = '<!-- autogen: feature-matrix -->';
const autogenClose = '<!-- /autogen: feature-matrix -->';

const regex = new RegExp(`(${autogenOpen})[\\s\\S]*?(${autogenClose})`, 'm');

const updatedReadme = readmeFile.replace(regex, `$1\n${featureMatrixMd}\n$2`);

await fs.writeFile(new URL('./README.md', rootUrl), updatedReadme, { encoding: 'utf-8' });

const rootDir = fileURLToPath(rootUrl);

spawnSync('yarn', ['format:readme-only'], { cwd: rootDir });
