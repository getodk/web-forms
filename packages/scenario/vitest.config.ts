/// <reference types="vitest" />
/// <reference types="vite/client" />

import type { CollectionValues } from '@getodk/common/types/collections/CollectionValues.ts';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
	let include: string[];
	let exclude: string[];
	const isBenchmark = mode === 'benchmark';
	if (isBenchmark) {
		include = ['./benchmark/**/*.bench.ts'];
		exclude = ['./src/**/*', './test/**/*'];
	} else {
		include = ['./test/**/*.test.ts'];
		exclude = ['./src/**/*', './benchmark/**/*'];
	}

	const supportedBrowsers = new Set(['chromium', 'firefox', 'webkit'] as const);
	type SupportedBrowser = CollectionValues<typeof supportedBrowsers>;
	const isSupportedBrowser = (browserName: string): browserName is SupportedBrowser =>
		supportedBrowsers.has(browserName as SupportedBrowser);

	const BROWSER_NAME = (() => {
		const envBrowserName = process.env.BROWSER_NAME;
		if (envBrowserName == null) return null;
		if (isSupportedBrowser(envBrowserName)) return envBrowserName;
		throw new Error(`Unsupported browser: ${envBrowserName}`);
	})();

	const BROWSER_ENABLED = BROWSER_NAME != null;
	const TEST_ENVIRONMENT = BROWSER_ENABLED ? undefined : 'jsdom'; // Fixed

	return {
		build: {
			target: 'esnext', // Fixed
		},
		esbuild: {
			sourcemap: true,
			target: 'esnext',
		},
		optimizeDeps: {
			esbuildOptions: { target: 'esnext' },
			exclude: ['@getodk/xforms-engine'],
			force: true,
			include: ['papaparse'],
		},
		resolve: {
			alias: {
				'@getodk/xforms-engine': resolve(__dirname, '../xforms-engine/src/index.ts'),
			},
			conditions: ['solid', 'browser', 'development'],
		},
		test: {
			pool: 'threads',
			testTimeout: process.env.CI ? 40 * 1000 : 10 * 1000, // Fixed
			browser: {
				enabled: BROWSER_ENABLED,
				name: BROWSER_NAME, // Fixed
				provider: 'playwright',
				headless: true,
				screenshotFailures: false,
			},
			include,
			exclude,
			deps: {
				inline: true,
				optimizer: {
					web: { exclude: ['solid-js'] },
				},
				moduleDirectories: ['node_modules', '../../node_modules'],
			},
			environment: TEST_ENVIRONMENT,
			globals: false,
			setupFiles: ['./src/vitest/setup.ts'],
			reporters: process.env.GITHUB_ACTIONS ? ['default', 'github-actions'] : 'default',
		},
	};
});
