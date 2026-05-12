import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/helpers/setup.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      thresholds: {
        global: {
          lines: 80,
        },
      },
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
