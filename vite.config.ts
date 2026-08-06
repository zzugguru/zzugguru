import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/zzugguru/',
  server: {
    port: 5173,
  },
  test: {
    environment: 'node',
  },
});
