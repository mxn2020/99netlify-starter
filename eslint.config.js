import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'build/**',
      'coverage/**',
      'node_modules/**',
      '.netlify/**',
      '*.config.js',
      '*.config.ts',
      'netlify/**',
      'functions/**',
      '.env*',
      '.vscode/**',
      '.idea/**'
    ]
  },
  // Node.js files configuration
  {
    files: ['**/*.cjs', 'test-*.js', 'clear-*.js', 'verify-*.js', 'scripts/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      sourceType: 'script'
    },
    rules: {
      'no-console': 'off', // Allow console in Node.js scripts
      'no-debugger': 'error',
      'no-unused-vars': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'off', // Disable Fast Refresh warnings
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': 'off', // Allow unused variables
      '@typescript-eslint/no-explicit-any': 'off', // Allow any types
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // General code quality rules
      'no-console': ['warn', { allow: ['warn', 'error', 'log', 'group', 'groupEnd'] }],
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-expressions': 'error',
      'prefer-const': 'error',
      'no-var': 'error',

      // React specific rules
      'react-hooks/exhaustive-deps': 'off', // Disable dependency warnings
      'react-hooks/rules-of-hooks': 'error',
    },
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'off', // Disable Fast Refresh warnings
      'no-unused-vars': 'off', // Allow unused variables in JS files
      'no-console': ['warn', { allow: ['warn', 'error', 'log', 'group', 'groupEnd'] }],
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-expressions': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  }
);
