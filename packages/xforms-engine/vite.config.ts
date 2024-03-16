/// <reference types="vite/client" />

import type { CollectionValues } from '@odk-web-forms/common/types/collections/CollectionValues';
import { resolve as resolvePath } from 'node:path';
import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import GithubActionsReporter from 'vitest-github-actions-reporter';
import type { UserConfig as VitestConfig } from 'vitest/config';

// TODO: this will hopefully be unnecessary when we update Vite/Vitest.
interface ViteConfig extends UserConfig, Pick<VitestConfig, 'test'> {}

const supportedBrowsers = new Set(['chromium', 'firefox', 'webkit'] as const);

type SupportedBrowser = CollectionValues<typeof supportedBrowsers>;

const isSupportedBrowser = (browserName: string): browserName is SupportedBrowser =>
	supportedBrowsers.has(browserName as SupportedBrowser);

const BROWSER_NAME = (() => {
	const envBrowserName = process.env.BROWSER_NAME;

	if (envBrowserName == null) {
		return null;
	}

	if (isSupportedBrowser(envBrowserName)) {
		return envBrowserName;
	}

	throw new Error(`Unsupported browser: ${envBrowserName}`);
})();

const BROWSER_ENABLED = BROWSER_NAME != null;

const TEST_ENVIRONMENT = BROWSER_ENABLED ? 'node' : 'jsdom';

export default defineConfig(({ mode }) => {
	const isTest = mode === 'test';
	const entries = ['./src/index.ts'];

	// Mapping entry names with path-based keys gives a more predictable output
	// which we control at the filesystem level, so the exports in package.json
	// are stable along with their paths and this config.
	const libEntry = Object.fromEntries(
		entries.map((entry) => [entry.replaceAll(/^\.\/src\/|\.ts$/g, ''), entry])
	);

	const external = ['@odk-web-forms/common'];

	return {
		build: {
			target: 'esnext',
			minify: false,
			sourcemap: true,
			emptyOutDir: false,
			outDir: './dist',
			manifest: true,
			lib: {
				entry: libEntry,
				formats: ['es'],
				name: '@odk-web-forms/xforms-engine',
				fileName(_, entryName) {
					if (entryName in libEntry) {
						return `${entryName}.js`;
					}

					return entryName.replace(/^\.src\//, '').replace(/\.ts$/, '.js');
				},
			},
			rollupOptions: { external },
		},

		esbuild: {
			target: 'esnext',
			format: 'esm',
			exclude: external,
		},

		optimizeDeps: {
			entries,
			force: true,
		},

		plugins: [
			// Generate type definitions. This is somehow more reliable than directly
			// calling tsc
			dts({
				entryRoot: './src',
				exclude: ['@odk-web-forms/common', 'test', 'vite-env.d.ts'],
				include: ['src/**/*.ts'],
			}),
		],

		resolve: {
			alias: {
				'@odk-web-forms/common/types': resolvePath(__dirname, '../common/types'),
				'@odk-web-forms/common': resolvePath(__dirname, '../common/src'),
			},

			// prettier-ignore
			conditions:
				isTest
					// Without this, anything using Solid reactivity fails inexplicably...
					? ['development', 'browser']
					: ['import', 'browser'],
		},

		test: {
			browser: {
				enabled: BROWSER_ENABLED,
				name: BROWSER_NAME!,
				provider: 'playwright',
				headless: true,
			},

			environment: TEST_ENVIRONMENT,
			globals: false,
			include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
			exclude: ['src/**/*.tsx', 'test/**/*.tsx'],
			reporters: process.env.GITHUB_ACTIONS ? ['default', new GithubActionsReporter()] : 'default',
		},
	} satisfies ViteConfig;
});