import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMcpClient, closeMcpClient } from '../client';
import { getMcpEnv } from '../../env/mcp';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

vi.mock('../../env/mcp', () => ({
  getMcpEnv: vi.fn(),
}));

vi.mock('@modelcontextprotocol/sdk/client/index.js', () => {
  return {
    Client: vi.fn(function() {
      return {
        connect: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      };
    })
  };
});

vi.mock('@modelcontextprotocol/sdk/client/streamableHttp.js', () => {
  return {
    StreamableHTTPClientTransport: vi.fn(),
  };
});

describe('MCP Client Adapter', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await closeMcpClient(); // reset singleton
  });

  it('initializes transport with bearer token and connects', async () => {
    vi.mocked(getMcpEnv).mockReturnValue({
      MCP_SERVER_URL: 'http://127.0.0.1:3001/mcp',
      MCP_INTERNAL_API_KEY: 'test-key',
    });

    const client = await getMcpClient();

    expect(getMcpEnv).toHaveBeenCalled();
    expect(StreamableHTTPClientTransport).toHaveBeenCalledWith(
      new URL('http://127.0.0.1:3001/mcp'),
      {
        requestInit: {
          headers: {
            'Authorization': 'Bearer test-key'
          }
        }
      }
    );
    expect(Client).toHaveBeenCalled();
    
    // Check singleton behavior
    const client2 = await getMcpClient();
    expect(client).toBe(client2);
    expect(Client).toHaveBeenCalledTimes(1);
  });
});
