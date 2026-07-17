import { defineConfig } from 'vitest/config';
import path from 'path';
import yaml from '@rollup/plugin-yaml';

export default defineConfig({
  plugins: [yaml()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
  },
});
