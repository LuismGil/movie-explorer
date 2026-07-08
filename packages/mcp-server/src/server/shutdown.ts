import type { Server } from 'node:http';
import { logInfo, logError } from '@mcp/observability/logger.js';

export function setupShutdownHandlers(
  server: Server,
  setShuttingDown: (val: boolean) => void
) {
  let isShuttingDown = false;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    logInfo('shutdown_initiated', { signal });
    setShuttingDown(true);

    const timeout = setTimeout(() => {
      logError('shutdown_timeout', { message: 'Forcing exit after timeout' });
      process.exit(1);
    }, 10000);

    server.close((err) => {
      clearTimeout(timeout);
      if (err) {
        logError('shutdown_error', { error: err.message });
        process.exit(1);
      }
      logInfo('shutdown_complete', { message: 'HTTP server closed safely' });
      process.exit(0);
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  
  return shutdown;
}
