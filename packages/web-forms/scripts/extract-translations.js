import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const TRANSLATION_FILE_EXTENSION = '.i18n.ts';
const OUTPUT_FILE_NAME = 'strings_en.json';
const OUTPUT_FOLDER = 'locales';

const findI18nFiles = async (dir) => {
	const entries = await readdir(dir, { withFileTypes: true });

	const paths = entries.map(async (entry) => {
		const fullPath = join(dir, entry.name);

		if (entry.isDirectory()) {
			return findI18nFiles(fullPath);
		}

		return fullPath.endsWith(TRANSLATION_FILE_EXTENSION) ? [fullPath] : [];
	});

	const resolvedPaths = await Promise.all(paths);
	return resolvedPaths.flat();
};

const buildAggregatedDictionary = async (filePaths) => {
	const imports = filePaths.map(async (filePath) => {
		const fileUrl = pathToFileURL(filePath).href;
		const module = await import(fileUrl);
		if (!module?.defaultStrings) {
			throw new Error(`Missing 'defaultStrings' export in ${filePath}`);
		}

		const namespace = basename(filePath, TRANSLATION_FILE_EXTENSION);
		return [namespace, module.defaultStrings];
	});

	const resolvedImports = await Promise.all(imports);
	return Object.fromEntries(resolvedImports);
};

const runExtraction = async () => {
	const rootDir = process.cwd();
	const srcDir = resolve(rootDir, 'src');
	const outputDir = resolve(rootDir, OUTPUT_FOLDER);
	const outputFile = join(outputDir, OUTPUT_FILE_NAME);

	try {
		const files = await findI18nFiles(srcDir);
		const dictionary = await buildAggregatedDictionary(files);

		await mkdir(outputDir, { recursive: true });
		await writeFile(outputFile, JSON.stringify(dictionary, null, 2), 'utf-8');

		// eslint-disable-next-line no-console
		console.log(
			`Successfully extracted ${files.length} namespaces to /${OUTPUT_FOLDER}/${OUTPUT_FILE_NAME}`
		);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Extraction failed:', error);
		process.exit(1);
	}
};

void runExtraction();
