// @ts-check

// TODO: consider using any of the zillion "TypeScript at runtime in Node"
// options so we can configure ESLint with a .ts file. Managing the types in JS
// syntax is maddening and highly error prone.

// TODO: look into a rule about aging TODOs. One from past usage required
// annotating with a date, but it'd be nice if we could just derive that from
// git history or whatever.

/// <reference path="./vendor-types/@eslint/eslintrc.d.ts" />
/// <reference path="./vendor-types/@vue/eslint-config-typescript/index.d.ts" />
/// <reference path="./vendor-types/eslint-plugin-no-only-tests.d.ts" />
/// <reference path="./vendor-types/eslint-plugin-vue/lib/configs/base.d.ts" />
/// <reference path="./vendor-types/eslint-plugin-vue/lib/configs/vue3-essential.d.ts" />
/// <reference path="./vendor-types/eslint-plugin-vue/lib/configs/vue3-strongly-recommended.d.ts" />
/// <reference path="./vendor-types/eslint-plugin-vue/lib/configs/vue3-recommended.d.ts" />
/// <reference path="./vendor-types/eslint-plugin-vue/lib/index.d.ts" />
/// <reference path="./vendor-types/eslint-plugin-vue/lib/processor.d.ts" />

import { FlatCompat } from '@eslint/eslintrc';
import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import jsdoc from 'eslint-plugin-jsdoc';
import noOnlyTestsPlugin from 'eslint-plugin-no-only-tests';
import vuePlugin from 'eslint-plugin-vue';
import vueBase from 'eslint-plugin-vue/lib/configs/base.js';
import vue3Essential from 'eslint-plugin-vue/lib/configs/vue3-essential.js';
import vue3Recommended from 'eslint-plugin-vue/lib/configs/vue3-recommended.js';
import vue3StronglyRecommended from 'eslint-plugin-vue/lib/configs/vue3-strongly-recommended.js';
import vueProcessor from 'eslint-plugin-vue/lib/processor.js';
import { builtinModules } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
	resolvePluginsRelativeTo: __dirname,
	recommendedConfig: eslint.configs.recommended,
	allConfig: eslint.configs.all,
});

/**
 * @param {string} pathSansExtension
 * @param {readonly string[]} extensions
 * @returns {string}
 */
const extensionsGlob = (pathSansExtension, extensions) => {
	const extensionsGlobPattern = `.{${extensions.join(',')}}`;

	return `${pathSansExtension}${extensionsGlobPattern}`;
};

const typeScriptFileExtensions = /** @type {const} */ ([
	'cjs',
	'cts',
	'js',
	'jsx',
	'mjs',
	'mts',
	'ts',
	'tsx',
]);

const vueFileExtensions = [...typeScriptFileExtensions, 'vue'];

/**
 * @param {string} pathSansExtensions
 */
const vueGlob = (pathSansExtensions) => {
	return extensionsGlob(pathSansExtensions, vueFileExtensions);
};

const vuePackageGlob = vueGlob('packages/web-forms/**/*');

/**
 * @typedef {import('eslint').Linter.FlatConfig} FlatConfig
 */

export default tseslint.config(
	{
		ignores: [
			'.changeset',
			'.github',
			'examples/**/*',
			'packages/*/index.d.ts',
			'packages/**/*.min.js',
			'packages/**/dist/**/*',
			'packages/**/fixtures/**/*',
			'packages/tree-sitter-xpath/grammar.js',
			'packages/tree-sitter-xpath/bindings/**/*',
			'packages/tree-sitter-xpath/types/**/*',
			'packages/xforms-engine/api-docs/**/*',
			'**/vendor',
		],
	},

	{
		plugins: { jsdoc },
		rules: {
			'jsdoc/no-undefined-types': [
				'error',
				{
					markVariablesAsUsed: true,
					disableReporting: true,
				},
			],
		},
	},

	{
		extends: [
			eslint.configs.recommended,

			// TODO: consider applying just the plugin and parser here, and applying
			// the base rules in a separate config (as was done with the Vue split,
			// also below).
			...tseslint.configs.recommendedTypeChecked,
			...tseslint.configs.stylisticTypeChecked,

			/**
			 * For future reference, there's a **lot** going on here. As briefly as
			 * reasonably possible, all of this happens for the `web-forms` package:
			 *
			 * 1. ESLint uses the Vue parser (`vue-eslint-parser`)
			 * 2. The Vue parser, in turn, uses the TypeScript parser
			 *    (`@typescript-eslint/parser`) for:
			 *
			 *    - `<script>` and `<script lang="ts">` within .vue files
			 *    - JavaScript and TypeScript source files
			 * 3. The Vue parser uses the espree parser (ESLint's default) for
			 *    `<template>` within .vue files
			 * 4. To ensure all of these play nicely, these plugins need to be (re-)
			 *    defined:
			 *
			 *    - `eslint-plugin-vue`
			 *    - `@typescript-eslint`
			 * 5. The Vue plugin's **processor** must also be (re-)applied.
			 *
			 * Absence of any of these caused either ESLint to fail to apply shared
			 * rules in affected areas, or ESLint itself to crash.
			 *
			 * Note: Contrary to the defaults provided in a Vue template project, it
			 * was found that linting applies most consistently by applying
			 * Vue-specific parsing **after** TypeScript.
			 *
			 * TODO: after breaking up the parser and rule aspects, it seemed likely
			 * that we could stop using `FlatCompat` for this. For reasons that are
			 * unclear, I wasn't able to find a way to get that working.
			 */
			...compat
				.config({
					parser: 'vue-eslint-parser',
					parserOptions: {
						/**
						 * @see {@link https://github.com/vuejs/vue-eslint-parser/issues/173#issuecomment-1367298274}
						 */
						parser: {
							// Script parser for `<script>` (without `lang` attribute)
							js: '@typescript-eslint/parser',

							// Script parser for `<script lang="ts">`
							ts: '@typescript-eslint/parser',

							// Script parser for vue directives (e.g. `v-if=` or `:attribute=`)
							// and vue interpolations (e.g. `{{variable}}`).
							// If not specified, the parser determined by `<script lang ="...">` is used.
							'<template>': 'espree',
						},
					},
				})
				.map((vueConfig) => ({
					files: [vuePackageGlob],
					plugins: {
						vue: vuePlugin,
						'@typescript-eslint': tseslint.plugin,
					},
					processor: vueProcessor,

					...vueConfig,
				})),

			eslintConfigPrettier,
		],

		languageOptions: {
			parserOptions: {
				ecmaFeatures: {
					modules: true,
				},
				ecmaVersion: 'latest',

				/**
				 * This **mostly** works, instructing the TypeScript parser and plugin
				 * to regard Vue modules as (special) TypeScript source modules. There
				 * is one known issue: when importing a .vue file within a traditional
				 * TypeScript module, there is some disagreement between aspects of the
				 * tools about what has been imported:
				 *
				 * - VSCode's TypeScript language server will not understand the import,
				 *   but this is addressed by the Volar VSCode extension. (Some
				 *   resources discuss something called "take-over mode", which I did
				 *   not need to enable explicitly; but there's a good chance this may
				 *   be an issue depending on a user's local setup.)
				 *
				 *   With Volar working as expected, the import is recognized in-editor
				 *   as a type representing a Vue module.
				 *
				 * - ESLint recognizes the import.
				 *
				 * - `@typescript-eslint` partially recognizes the import. Some rules
				 *   which might be affected apply correctly. Rules which depend on type
				 *   information, however, apparently fail to recognize the type that
				 *   the Volar plugin recognizes. There is a variety of discussion that
				 *   can be tracked down on the topic, but from what I can tell this is
				 *   a breakdown in how the `@typescript-eslint` and `vue-plugin-eslint`
				 *   internals communicate about the `typescript` package's internal
				 *   `Program` representation. I do not believe this can be meaningfully
				 *   resolved at this time without undue effort. In the meantime, the
				 *   most likely workaround will be something like this (using the
				 *   `router.ts` from Vue's template project as an example):
				 *
				 *   ```ts
				 *   import { createRouter, createWebHistory } from 'vue-router';
				 *   import HomeView from '../views/HomeView.vue';
				 *
				 *   const router = createRouter({
				 *     history: createWebHistory(import.meta.env.BASE_URL),
				 *     routes: [
				 *       {
				 *         path: '/',
				 *         name: 'home',
				 *         // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				 *         component: HomeView,
				 *       },
				 *     ],
				 *   });
				 *   ```
				 *
				 *   In particular, note that the
				 *   `@typescript-eslint/no-unsafe-assignment` rule is disabled where
				 *   the imported Vue component is assigned to a property. This is due
				 *   to a manifest of this breakdown between the tool internals
				 *   reasoning about the underlying TypeScript `Program`: as far as
				 *   `@typescript-eslint` is aware, the value has an `any` type (and we
				 *   error when assigning `any` values, even though their type is
				 *   technically assignable, as an extra safety check).
				 */
				extraFileExtensions: ['.vue'],

				project: [
					'./tsconfig.json',
					'./tsconfig.tools.json',
					'./tsconfig.vendor-types.json',
					'./examples/*/tsconfig.json',
					'./packages/**/tsconfig.json',

					// NOTE: `@typescript-eslint` doesn't resolve composite projects. For
					// now we just list all of these directly. In the future, we should
					// consider whether we can have a single composite config for the full
					// project. This is something I wanted to explore on project init, but
					// backed off because the documentation was kind of impenetrable. But
					// Vue's project template does a great job of illustrating the use,
					// and I suspect we'd benefit from applying the pattern throughout the
					// entire monorepo.
					'./packages/web-forms/tsconfig.json',
					'./packages/web-forms/tsconfig.app.json',
					'./packages/web-forms/tsconfig.node.json',
					'./packages/web-forms/tsconfig.vitest.json',

					'./scripts/tsconfig.json',
				],
			},

			sourceType: 'module',
		},

		linterOptions: {
			reportUnusedDisableDirectives: true,
		},

		plugins: {
			'no-only-tests': noOnlyTestsPlugin,
		},

		// Base rules, applied across project and throughout all packages (unless
		// overridden in subsequent configs)
		rules: {
			// This override is recommended by typescript-eslint, because TypeScript
			// does a much better job of it, and gives us better control over which
			// globals are present in a given context. This also obviates any need
			// for specifying other globals in this config.
			'no-undef': 'off',

			'@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', ignoreRestSiblings: true },
			],
			'no-only-tests/no-only-tests': 'error',
			'@typescript-eslint/no-shadow': 'error',
			'no-console': 'error',

			'@typescript-eslint/class-literal-property-style': 'error',
			'@typescript-eslint/consistent-indexed-object-style': 'error',
			'@typescript-eslint/consistent-type-definitions': 'error',
			'@typescript-eslint/dot-notation': [
				'error',
				{
					allowIndexSignaturePropertyAccess: true,
				},
			],
			'@typescript-eslint/no-base-to-string': 'error',
			'@typescript-eslint/no-empty-function': 'error',
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/no-misused-promises': 'error',
			'@typescript-eslint/no-redundant-type-constituents': 'error',
			'@typescript-eslint/no-this-alias': 'error',
			'@typescript-eslint/no-unsafe-argument': 'error',
			'@typescript-eslint/no-unsafe-assignment': 'error',
			'@typescript-eslint/no-unsafe-call': 'error',
			'@typescript-eslint/no-unsafe-member-access': 'error',
			'@typescript-eslint/no-unsafe-return': 'error',
			'@typescript-eslint/prefer-nullish-coalescing': 'error',
			'@typescript-eslint/prefer-optional-chain': 'error',
			'@typescript-eslint/prefer-string-starts-ends-with': 'error',
			'@typescript-eslint/require-await': 'error',
			'@typescript-eslint/restrict-plus-operands': 'error',
			'@typescript-eslint/restrict-template-expressions': 'error',
			'@typescript-eslint/sort-type-constituents': 'warn',
			'@typescript-eslint/unbound-method': 'error',
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/await-thenable': 'error',
			'@typescript-eslint/no-empty-interface': [
				'error',
				{
					allowSingleExtends: true,
				},
			],
			'prefer-const': 'error',

			// Ensure Node built-ins aren't used by default
			'no-restricted-imports': [
				'error',
				{
					paths: [...builtinModules],
					patterns: ['node:*'],
				},
			],
		},
	},

	{
		files: [vuePackageGlob],
		/**
		 * These are the rules applied by the Vue project template. We can of course
		 * refine from there to suit our needs.
		 *
		 * TODO: The Vue template project included only the "essential" rules by
		 * default. We've added both the "strongly recommended" and "recommended"
		 * sets, but we'll likely want to relax and/or configure some of them as we
		 * run into issues.
		 */
		rules: {
			...vueBase.rules,
			...vue3Essential.rules,
			...vue3StronglyRecommended.rules,
			...vue3Recommended.rules,

			// Consistent with all other source code
			'vue/html-indent': ['error', 'tab'],
			// should be based on the printWidth
			'vue/max-attributes-per-line': 'off',
			'vue/no-undef-components': 'error',
			'vue/html-comment-indent': ['error', 'tab'],
			'vue/script-indent': ['error', 'tab'],
			'vue/no-empty-component-block': 'error',
		},
	},

	{
		files: ['eslint.config.js', 'packages/**/*.d.ts', 'vendor-types/**/*.d.ts'],
		rules: {
			'@typescript-eslint/triple-slash-reference': 'off',
		},
	},

	{
		files: [
			'eslint.config.js',
			'scripts/**/*.js',
			'packages/*/playwright.config.ts',
			'packages/*/vite.config.ts',
			'packages/*/vitest.config.ts',
			'packages/xforms-engine/vite.*.config.ts',
			'packages/*/tools/**/*',
			'packages/tree-sitter-xpath/scripts/build/*.mjs',

			// TODO: in theory, all e2e tests (if they continue to be run with
			// Playwright) are technically run in a "Node" environment, although
			// they will likely exercise non-Node code when calling into the
			// Playwright-managed browser process. I'm adding this special case
			// mainly to make note of this because it's unclear what the best
			// solution will be for mixed Node-/browser-API code in terms of type
			// safety and linting.
			'packages/tree-sitter-xpath/e2e/sub-expression-queries.test.ts',
		],
		rules: {
			'no-restricted-imports': 'off',
		},
	}
);
