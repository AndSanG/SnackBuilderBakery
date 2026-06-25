import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // Implementing an async port (repository, service) with a synchronous
      // body is intentional here, not a missing await.
      '@typescript-eslint/require-await': 'off',
    },
  },
  // Tests build ad-hoc stubs and cast freely; the no-unsafe-* family is noise
  // there. The promise rules stay on so a forgotten await still fails.
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  // The flat config itself is plain JS, outside the TS project.
  { files: ['**/*.mjs'], ...tseslint.configs.disableTypeChecked },
);
