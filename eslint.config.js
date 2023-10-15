/// <reference path="./vendor-types/@eslint/eslintrc.d.ts" />
/// <reference path="./vendor-types/@typescript-eslint/parser.d.ts" />
/// <reference path="./vendor-types/eslint-plugin-no-only-tests.d.ts" />
// @ts-check

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typeScriptESLintParser from '@typescript-eslint/parser';
import noOnlyTestsPlugin from 'eslint-plugin-no-only-tests';
import { builtinModules } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import eslintConfigPrettier from 'eslint-config-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
	resolvePluginsRelativeTo: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

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
const typeScriptExtensionsGlobPattern = `.{${typeScriptFileExtensions.join(',')}}`;

/**
 * @param {string} pathSansExtension
 */
const typeScriptGlob = (pathSansExtension) => {
	return `${pathSansExtension}${typeScriptExtensionsGlobPattern}`;
};

/** @type {import('eslint').Linter.FlatConfig[]} */
const configs = [
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
			'**/vendor',
		],
	},

	{
		languageOptions: {
			parser: typeScriptESLintParser,
			parserOptions: {
				ecmaFeatures: {
					modules: true,
				},
				ecmaVersion: 'latest',
				project: [
					'./tsconfig.json',
					'./tsconfig.tools.json',
					'./tsconfig.vendor-types.json',
					'./examples/*/tsconfig.json',
					'./packages/**/tsconfig.json',
					'./scripts/tsconfig.json',
				],
				tsconfigRootDir: __dirname,
			},
			sourceType: 'module',
			globals: {
				globalThis: false, // Apparently this means read-only?
			},
		},

		linterOptions: {
			reportUnusedDisableDirectives: true,
		},

		plugins: {
			'no-only-tests': noOnlyTestsPlugin,
		},
	},

	...compat.config({
		plugins: ['@typescript-eslint'],
		extends: [
			'plugin:@typescript-eslint/recommended-type-checked',
			'plugin:@typescript-eslint/stylistic-type-checked',
		],
	}),

	eslintConfigPrettier,

	{
		rules: {
			'@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', ignoreRestSiblings: true },
			],
			'no-only-tests/no-only-tests': 'error',
			'@typescript-eslint/no-shadow': 'error',
			'no-console': 'warn',

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
		files: ['eslint.config.js'],
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
	},

	{
		files: [
			typeScriptGlob('packages/**/e2e/*'),
			typeScriptGlob('packages/**/test/*'),
			typeScriptGlob('packages/**/*.{spec,test}'),
		],
		rules: {
			'no-console': 'warn',
			'@typescript-eslint/no-shadow': 'warn',
			'@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
		},
	},
];

export default configs;
