import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'src/generated/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'uploads/**',
      'temp/**',
      'tmp/**',
      'prisma/migrations/**',
    ],
  },
  {
    files: ['**/*.ts'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],

      // Kode sudah dirapikan (18 Nov 2026) sehingga aturan ini kembali 'error':
      // - slot generik Request yang tidak dipakai memakai `unknown`, bukan `{}`
      // - `req.body` di middleware validasi bertipe `unknown`, bukan `any`
      // - augmentasi Express pindah ke src/types/express.d.ts (allowDeclarations)
      '@typescript-eslint/no-empty-object-type': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
    },
  },
  {
    files: ['**/*.mjs', '**/*.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
);
