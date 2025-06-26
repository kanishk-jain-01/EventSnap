const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: {
        __DEV__: 'readonly',
        console: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        process: 'readonly',
        global: 'readonly',
        Buffer: 'readonly',
        React: 'readonly',
      },
    },
    rules: {
      // Basic code quality rules
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      'no-undef': 'off', // TypeScript handles this

      // Code style
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],

      // Best practices
      eqeqeq: 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
    },
  },
  // Cloud Functions specific rules - allow console statements for logging
  {
    files: ['functions/**/*.{js,ts}'],
    rules: {
      'no-console': 'off', // Console statements are the standard logging method for Cloud Functions
    },
  },
  {
    ignores: [
      'node_modules/',
      '.expo/',
      'dist/',
      'build/',
      'coverage/',
      'functions/lib/',
      '*.log',
      '.DS_Store',
      '.env*',
      '.firebaserc',
      'firebase.json',
      '*.rules',
      '*.indexes.json',
    ],
  },
];
