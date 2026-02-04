import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['*.ts', '*.mts', '*.cts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'property',
          format: ['camelCase', 'snake_case', 'UPPER_CASE'],
        },
      ],
    },
  },
];
