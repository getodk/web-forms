// flat-config is not supported by eslint-plugin-vue at the time of writing this
// extension is cjs because eslint doesn't support ES Modules

// suggested by eslint-config-typescript to avoid too many dependencies
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-essential',
    '@vue/eslint-config-typescript',
    'prettier',
  ],
  rules: {
    // override/add rules settings here, such as:
    // 'vue/no-unused-vars': 'error'
  },
};
