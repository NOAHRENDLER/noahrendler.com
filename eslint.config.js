import js from '@eslint/js';
import security from 'eslint-plugin-security';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    plugins: { security },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser
      }
    },
    rules: {
      // Security plugin rules
      'security/detect-eval-with-expression': 'error',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-object-injection': 'warn',
      'security/detect-possible-timing-attacks': 'warn',

      // No dangerous JS patterns
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // Code quality
      'no-alert': 'warn',
      'no-console': 'warn',
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }]
    }
  }
];
