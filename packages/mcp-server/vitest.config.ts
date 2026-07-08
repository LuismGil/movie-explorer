import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: true,
    env: {
      NODE_ENV: 'test',
      TMDB_API_KEY: 'test-tmdb-key',
      MCP_INTERNAL_API_KEY: 'test-internal-key-must-be-at-least-32-chars!',
      MCP_PORT: '3001',
      MCP_HOST: '127.0.0.1'
    }
  },
  resolve: {
    alias: {
      '@mcp': '/src'
    }
  }
});
