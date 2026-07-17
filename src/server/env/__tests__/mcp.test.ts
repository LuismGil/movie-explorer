import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getMcpEnv, _resetMcpEnvCacheForTesting } from '../../env/mcp';

describe('MCP Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    _resetMcpEnvCacheForTesting();
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('validates correct environment variables', () => {
    process.env.MCP_SERVER_URL = 'http://127.0.0.1:3001/mcp';
    process.env.MCP_INTERNAL_API_KEY = 'a-super-secret-key-that-is-long-enough-32-chars';
    
    const env = getMcpEnv();
    expect(env.MCP_SERVER_URL).toBe('http://127.0.0.1:3001/mcp');
    expect(env.MCP_INTERNAL_API_KEY).toBe('a-super-secret-key-that-is-long-enough-32-chars');
  });

  it('provides a default MCP_SERVER_URL', () => {
    delete process.env.MCP_SERVER_URL;
    process.env.MCP_INTERNAL_API_KEY = 'a-super-secret-key-that-is-long-enough-32-chars';
    
    const env = getMcpEnv();
    expect(env.MCP_SERVER_URL).toBe('http://127.0.0.1:3001/mcp');
  });

  it('throws without leaking details when MCP_INTERNAL_API_KEY is missing or too short', () => {
    process.env.MCP_INTERNAL_API_KEY = 'too-short';
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => getMcpEnv()).toThrow('Invalid MCP environment configuration. Ensure MCP_INTERNAL_API_KEY is correctly set.');
    
    // Assert we only logged the generic message, no secrets
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to validate MCP environment configuration.');
    
    consoleErrorSpy.mockRestore();
  });
});
