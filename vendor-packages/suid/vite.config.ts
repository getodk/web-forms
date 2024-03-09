/// <reference types="vitest" />
/// <reference types="vite/client" />

// TODO: share Vite config where makes sense

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import noBundle from 'vite-plugin-no-bundle';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig(() => {
	return {
		build: {
			target: 'esnext',
			minify: false,
			sourcemap: true,
			emptyOutDir: false,
			outDir: './dist',
			manifest: true,
			rollupOptions: {
				external: ['solid-js', 'solid-js/web'],
			},
			lib: {
				entry: {
					material: './src/material.ts',
					'icons-material': './src/icons-material.ts',
				},
				formats: ['es' as const],
				name: 'suid',
			},
		},
		esbuild: {
			sourcemap: true,
			target: 'esnext',
		},
		optimizeDeps: {
			esbuildOptions: {
				target: 'esnext',
			},
			exclude: ['solid-js', 'solid-js/web'],
			entries: ['./src/**/*.ts'],
		},
		plugins: [
			// Solid's JSX transform (dom-expressions), optimizes DOM access in components
			solidPlugin({
				babel: {
					babelrc: false,
					configFile: false,

					// Transform the BigInt polyfill (used by the Temporal polyfill) to use native
					// APIs. We can safely assume BigInt is available for our target platforms.
					plugins: ['transform-jsbi-to-bigint'],
				},
			}),

			// Generate type definitions. This turned out to be more reliable in
			// @odk-web-forms/xpath. TODO: revisit in case it makes sense to use tsc
			// directly in this package
			dts(),

			noBundle(),
		],

		resolve: {
			conditions: ['browser', 'development'],
		},
	};
});
