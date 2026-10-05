import { describe, it, expect } from 'vitest';
import { envSchema } from '@mcp/config/env.js';

describe('Environment validation', () => {
  it('valid environment parses successfully', () => {
    const valid = {
      NODE_ENV: 'development',
      TMDB_API_KEY: 'valid-key',
      MCP_INTERNAL_API_KEY: 'this-is-a-valid-internal-key-with-32-chars!',
      MCP_PORT: '3001',
      MCP_HOST: '127.0.0.1',
      MCP_ALLOWED_ORIGINS: 'http://localhost:3000,https://example.com'
    };
    
    const parsed = envSchema.parse(valid);
    expect(parsed.TMDB_API_KEY).toBe('valid-key');
    expect(parsed.MCP_PORT).toBe(3001);
    expect(parsed.MCP_ALLOWED_ORIGINS).toEqual(['http://localhost:3000', 'https://example.com']);
  });

  it('uses the platform PORT when MCP_PORT is not set', () => {
    const parsed = envSchema.parse({
      TMDB_API_KEY: 'valid-key',
      MCP_INTERNAL_API_KEY: 'this-is-a-valid-internal-key-with-32-chars!',
      PORT: '10000',
    });

    expect(parsed.MCP_PORT).toBe(10000);
  });

  it('prefers an explicitly configured MCP_PORT over the platform PORT', () => {
    const parsed = envSchema.parse({
      TMDB_API_KEY: 'valid-key',
      MCP_INTERNAL_API_KEY: 'this-is-a-valid-internal-key-with-32-chars!',
      PORT: '10000',
      MCP_PORT: '3001',
    });

    expect(parsed.MCP_PORT).toBe(3001);
  });

  it('fails if TMDB_API_KEY is missing', () => {
    const invalid = {
      NODE_ENV: 'development',
      MCP_INTERNAL_API_KEY: 'this-is-a-valid-internal-key-with-32-chars!',
    };
    const result = envSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('fails if MCP_INTERNAL_API_KEY is missing or too short', () => {
    const invalidShort = {
      TMDB_API_KEY: 'valid-key',
      MCP_INTERNAL_API_KEY: 'short',
    };
    const result = envSchema.safeParse(invalidShort);
    expect(result.success).toBe(false);
  });

  it('fails with invalid port', () => {
    const invalidPort = {
      TMDB_API_KEY: 'valid-key',
      MCP_INTERNAL_API_KEY: 'this-is-a-valid-internal-key-with-32-chars!',
      MCP_PORT: '99999'
    };
    const result = envSchema.safeParse(invalidPort);
    expect(result.success).toBe(false);
  });

  it('fails with an invalid platform PORT', () => {
    const invalid = {
      TMDB_API_KEY: 'valid-key',
      MCP_INTERNAL_API_KEY: 'this-is-a-valid-internal-key-with-32-chars!',
      PORT: 'not-a-port',
    };

    expect(envSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects origins with paths, query strings, or fragments', () => {
    const invalidOrigin = {
      TMDB_API_KEY: 'valid-key',
      MCP_INTERNAL_API_KEY: 'this-is-a-valid-internal-key-with-32-chars!',
      MCP_ALLOWED_ORIGINS: 'http://localhost:3000/path'
    };
    const result = envSchema.safeParse(invalidOrigin);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).not.toContain('this-is-a-valid-internal-key-with-32-chars!');
    }
  });

  it('normalizes comma-separated origins', () => {
    const validOrigins = {
      TMDB_API_KEY: 'valid-key',
      MCP_INTERNAL_API_KEY: 'this-is-a-valid-internal-key-with-32-chars!',
      MCP_ALLOWED_ORIGINS: ' http://localhost:3000 , https://example.com  '
    };
    const parsed = envSchema.parse(validOrigins);
    expect(parsed.MCP_ALLOWED_ORIGINS).toEqual(['http://localhost:3000', 'https://example.com']);
  });

  it('does not expose secrets in validation errors', () => {
    const invalid = {
      TMDB_API_KEY: 'secret-tmdb-key-value',
      MCP_INTERNAL_API_KEY: 'secret-internal-key-value-must-be-long-enough!',
      MCP_PORT: 'invalid'
    };
    const result = envSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorStr = result.error.toString();
      expect(errorStr).not.toContain('secret-tmdb-key-value');
      expect(errorStr).not.toContain('secret-internal-key-value-must-be-long-enough!');
    }
  });
});
