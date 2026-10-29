import 'server-only';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { getMcpEnv } from '../env/mcp';
import { awaitWithSignal, createDeadline, throwIfAborted } from '../runtime/abort';

type Connection = { client: Client; pending: Promise<Client> };
let connection: Connection | null = null;
const MCP_INITIALIZATION_TIMEOUT_MS = 20_000;

function startConnection(): Connection {
  const env = getMcpEnv();
  const transport = new StreamableHTTPClientTransport(new URL(env.MCP_SERVER_URL), {
    requestInit: {
      headers: { 'Authorization': `Bearer ${env.MCP_INTERNAL_API_KEY}` },
      redirect: 'error',
    },
  });
  const client = new Client({ name: 'movie-explorer-mcp-client', version: '1.0.0' }, { capabilities: {} });
  client.onclose = () => { if (connection?.client === client) connection = null; };
  const pending: Promise<Client> = Promise.resolve().then(async () => {
    const deadline = createDeadline(MCP_INITIALIZATION_TIMEOUT_MS);
    try {
      // Shared initialization has its own bound; cancelling one waiter must not cancel other callers.
      await awaitWithSignal(() => client.connect(transport, {
        signal: deadline.signal, timeout: MCP_INITIALIZATION_TIMEOUT_MS, maxTotalTimeout: MCP_INITIALIZATION_TIMEOUT_MS,
      }), deadline.signal);
      if (connection !== state) throw new Error('Connection replaced');
      return client;
    } catch {
      if (connection === state) connection = null;
      void client.close().catch(() => undefined);
      console.error('MCP connection initialization failed.');
      throw new Error('Failed to establish connection with the MCP backend.');
    } finally {
      deadline.dispose();
    }
  });
  const state: Connection = { client, pending };
  connection = state;
  return state;
}

export async function getMcpClient(options: { signal?: AbortSignal } = {}): Promise<Client> {
  throwIfAborted(options.signal);
  const state = connection ?? startConnection();
  return awaitWithSignal(() => state.pending, options.signal);
}

export async function closeMcpClient(): Promise<void> {
  const state = connection;
  connection = null;
  if (state) await state.client.close();
}
