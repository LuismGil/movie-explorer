import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

export async function createMcpServer() {
  const server = new Server({
    name: 'movie-explorer-mcp',
    version: '1.0.0',
  }, {
    capabilities: {
      tools: {}
    }
  });
  
  server.setRequestHandler(
    ListToolsRequestSchema,
    async () => ({
      tools: []
    })
  );

  return server;
}
