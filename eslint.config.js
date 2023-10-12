// @ts-check

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import { builtinModules } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
	resolvePluginsRelativeTo: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

/** @type {import('eslint').Linter.FlatConfig[]} */
const configs = [
	...compat.config({
		ignorePatterns: [
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

		extends: [
			'plugin:@typescript-eslint/recommended-type-checked',
			'plugin:@typescript-eslint/stylistic-type-checked',
			'prettier',
		],
		parser: '@typescript-eslint/parser',
		parserOptions: {
			project: [
				'./packages/*/tsconfig.json',
				'./scripts/tsconfig.json',
				'./tsconfig.eslint.json',
				'./tsconfig.test.json',
				'./tsconfig.build.json',
			],
			tsconfigRootDir: __dirname,
		},
		plugins: ['@typescript-eslint', 'prettier', 'no-only-tests'],

		rules: {
			'@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', ignoreRestSiblings: true },
			],
			'no-only-tests/no-only-tests': 'error',
			'@typescript-eslint/no-shadow': ['error'],
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
		overrides: [
			{
				files: [
					'eslint.config.js',
					'scripts/**/*.js',
					'packages/*/playwright.config.ts',
				],
				env: {
					node: true,
				},
				rules: {
					'no-restricted-imports': 'off',
				},
			},
			{
				files: ['eslint.config.js'],
				rules: {
					'@typescript-eslint/triple-slash-reference': 'warn',
				},
			},
			{
				files: ['packages/**/test/*.js', 'packages/**/*.js'],
				env: {
					mocha: true,
				},
				globals: {
					globalThis: false, // false means read-only
				},
				rules: {
					'no-console': 'warn',
				},
			},
		],
	}),
];

export default configs;
