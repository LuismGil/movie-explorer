import { createHttpApp } from '@mcp/server/create-http-app.js';
import { setupShutdownHandlers } from '@mcp/server/shutdown.js';
import { env } from '@mcp/config/env.js';
import { logInfo, logError } from '@mcp/observability/logger.js';

async function main() {
  try {
    const { app, setShuttingDown } = createHttpApp();

    const server = app.listen(env.MCP_PORT, env.MCP_HOST, () => {
      logInfo('server_started', {
        name: 'movie-explorer-mcp',
        host: env.MCP_HOST,
        port: env.MCP_PORT,
        env: env.NODE_ENV,
        status: 'ready'
      });
    });

    setupShutdownHandlers(server, setShuttingDown);
  } catch (error) {
    logError('server_startup_failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    process.exit(1);
  }
}

main();
