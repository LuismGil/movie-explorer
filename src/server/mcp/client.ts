import 'server-only';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { getMcpEnv } from '../env/mcp';

// Singleton instance to prevent creating multiple connections in development/SSR
let mcpClientInstance: Client | null = null;
let mcpTransportInstance: StreamableHTTPClientTransport | null = null;

export async function getMcpClient(): Promise<Client> {
  if (mcpClientInstance) {
    return mcpClientInstance;
  }

  const env = getMcpEnv();
  
  // We use the Streamable HTTP transport as defined in the Phase 6 architecture
  mcpTransportInstance = new StreamableHTTPClientTransport(new URL(env.MCP_SERVER_URL), {
    requestInit: {
      headers: {
        'Authorization': `Bearer ${env.MCP_INTERNAL_API_KEY}`
      }
    }
  });

  mcpClientInstance = new Client(
    {
      name: 'movie-explorer-mcp-client',
      version: '1.0.0'
    },
    {
      capabilities: {}
    }
  );

  try {
    await mcpClientInstance.connect(mcpTransportInstance);
  } catch (error) {
    mcpClientInstance = null;
    mcpTransportInstance = null;
    console.error('Failed to connect to the MCP server', error instanceof Error ? error.message : '');
    throw new Error('Failed to establish connection with the MCP backend.');
  }

  return mcpClientInstance;
}

export async function closeMcpClient(): Promise<void> {
  if (mcpClientInstance) {
    await mcpClientInstance.close();
    mcpClientInstance = null;
    mcpTransportInstance = null;
  }
}
