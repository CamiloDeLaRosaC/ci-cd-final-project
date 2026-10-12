const globals = require('globals');

module.exports = [
  { ignores: ['node_modules/**', 'coverage/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'commonjs', globals: globals.node },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }], 'no-undef': 'error', 'eqeqeq': 'error',
      'no-unreachable': 'error', 'no-constant-condition': 'error',
      'no-duplicate-case': 'error', 'no-dupe-keys': 'error', 'no-var': 'error',
      'prefer-const': 'error'
    }
  },
  { files: ['tests/**/*.js'], languageOptions: { globals: globals.jest } }
];
