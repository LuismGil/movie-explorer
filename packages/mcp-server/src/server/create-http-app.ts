import express from 'express';
import { randomUUID } from 'node:crypto';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { env } from '@mcp/config/env.js';
import { authenticate } from '@mcp/security/auth.js';
import { validateOrigin } from '@mcp/security/origin.js';
import { logInfo, logError } from '@mcp/observability/logger.js';
import { createMcpServer } from '@mcp/server/create-mcp-server.js';

export function createHttpApp() {
  const app = createMcpExpressApp({ host: env.MCP_HOST });

  app.use((_req, res, next) => {
    let requestId = _req.headers['x-request-id'];
    if (typeof requestId !== 'string' || !/^[A-Za-z0-9\-_]{1,64}$/.test(requestId)) {
      requestId = randomUUID();
    }
    _req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  });

  app.use(express.json({ limit: '10mb' }));

  app.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  let isShuttingDown = false;
  app.get('/ready', (_req, res) => {
    if (isShuttingDown) {
      res.status(503).json({ status: 'not_ready' });
    } else {
      res.status(200).json({ status: 'ready' });
    }
  });

  app.post('/mcp', authenticate, validateOrigin, async (req, res) => {
    // @ts-expect-error stateless mode
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined // stateless mode
    });
    
    const server = await createMcpServer();
    // @ts-expect-error mismatch with exactOptionalPropertyTypes
    await server.connect(transport);
    
    const start = Date.now();
    logInfo('mcp_request_start', {
      requestId: req.headers['x-request-id'],
      method: req.method,
      route: req.path
    });

    try {
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      logError('mcp_request_error', {
        requestId: req.headers['x-request-id'],
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    } finally {
      // The transport is scoped to the request in stateless mode.
      try {
        await server.close();
      } catch {
        // ignore
      }
      logInfo('mcp_request_end', {
        requestId: req.headers['x-request-id'],
        status: res.statusCode,
        duration: Date.now() - start
      });
    }
  });

  app.all('/mcp', (_req, res) => {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method Not Allowed' });
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // Global error handler
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logError('unhandled_error', {
      requestId: req.headers['x-request-id'],
      error: err.message
    });
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return {
    app,
    setShuttingDown: (val: boolean) => { isShuttingDown = val; }
  };
}
