// @ts-check

const { builtinModules } = require('module');

/**
 * This ESLint config presently borrows heavily from
 * {@link https://github.com/withastro/astro | Astro}, but quite a few of the
 * rules have been made errors (or warnings) where Astro had disabled them. It's
 * possible many of these rules are redundant to the presets, and those should
 * be removed in a more thorough setup pass.
 *
 * @type {import('eslint').ESLint.ConfigData}
 */
module.exports = {
  root: true,
  extends: [
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./packages/*/tsconfig.json', './tsconfig.eslint.json'],
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
      files: ['scripts/**/*.js'],
      env: {
        node: true,
      },
      rules: {
        'no-restricted-imports': 'off',
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
};
