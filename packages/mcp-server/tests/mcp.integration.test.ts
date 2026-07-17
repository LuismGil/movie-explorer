import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createHttpApp } from '@mcp/server/create-http-app.js';
import { env } from '@mcp/config/env.js';

describe('MCP Integration Test', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let server: any;
  let port: number;

  beforeAll(async () => {
    const { app } = createHttpApp();
    
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        port = server.address().port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  it('tools/list -> empty tool collection', async () => {
    const transport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`), {
      requestInit: {
        headers: {
          'Authorization': `Bearer ${env.MCP_INTERNAL_API_KEY}`
        }
      }
    });

    const client = new Client(
      {
        name: 'test-client',
        version: '1.0.0'
      },
      {
        capabilities: {}
      }
    );

    // @ts-expect-error exactOptionalPropertyTypes mismatch
    await client.connect(transport);
    
    const result = await client.listTools();
    expect(result.tools.length).toBe(5);
    const names = result.tools.map(t => t.name).sort();
    expect(names).toEqual([
      'get_credits',
      'get_movie_details',
      'get_recommendations',
      'get_trending',
      'search_movies'
    ]);
    
    await client.close();
  });
});
