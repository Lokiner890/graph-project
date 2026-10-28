/// <reference types="vitest/config" />

import { defineConfig } from 'vite';
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // React Compiler adds memoization automatically, no manual useMemo / useCallback / memo needed.
    // Disabled in tests: its generated memo-cache branches show up as uncovered branches in coverage,
    // which pulls the SonarQube coverage below the quality gate even when every line is tested.
    mode !== 'test' && babel({ presets: [reactCompilerPreset()] }),
  ],
  resolve: {
    // resolves the `@/*` alias from tsconfig.app.json `paths`
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: 'jsdom', // Needed for React Testing Library
    setupFiles: './src/__tests__/setup.ts',
    coverage: {
      reporter: ['text', 'json', 'lcov'],
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: ['src/main.tsx', 'src/instrument.ts', 'src/**/*.d.ts', 'src/__tests__/**'],
    },
  },
}));
