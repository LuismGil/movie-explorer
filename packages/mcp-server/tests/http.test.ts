import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createHttpApp } from '@mcp/server/create-http-app.js';
import { env } from '@mcp/config/env.js';

describe('HTTP Server', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let app: any;
  let setShuttingDown: (val: boolean) => void;

  beforeEach(() => {
    const httpApp = createHttpApp();
    app = httpApp.app;
    setShuttingDown = httpApp.setShuttingDown;
  });

  it('/health returns exact minimal response', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('/ready returns exact minimal response', async () => {
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ready' });
  });

  it('readiness returns 503 during shutdown state', async () => {
    setShuttingDown(true);
    const res = await request(app).get('/ready');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: 'not_ready' });
  });

  it('unknown route returns generic 404', async () => {
    const res = await request(app).get('/unknown');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not Found' });
  });

  it('/mcp without authentication returns 401', async () => {
    const res = await request(app).post('/mcp');
    expect(res.status).toBe(401);
    expect(res.headers['www-authenticate']).toBe('Bearer');
  });

  it('malformed bearer header returns 401', async () => {
    const res = await request(app)
      .post('/mcp')
      .set('Authorization', 'Basic token');
    expect(res.status).toBe(401);
  });

  it('invalid bearer token returns 401', async () => {
    const res = await request(app)
      .post('/mcp')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
  });

  it('valid bearer token is accepted by authentication middleware', async () => {
    // Wait, it will 400 because body might be missing, but it will pass auth
    const res = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${env.MCP_INTERNAL_API_KEY}`)
      .send({});
    // The MCP server handles empty body. Let's see what it returns. It might return 200 or 400.
    // As long as it's not 401, auth passed.
    expect(res.status).not.toBe(401);
  });

  it('invalid origin returns 403', async () => {
    // Assuming MCP_ALLOWED_ORIGINS is not set in vitest.config, wait, it isn't set.
    // If not set, it defaults to undefined, which allows any origin?
    // Let's check origin.ts: if (!env.MCP_ALLOWED_ORIGINS || length === 0) return 403 if origin exists!
    const res = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${env.MCP_INTERNAL_API_KEY}`)
      .set('Origin', 'http://malicious.com');
    expect(res.status).toBe(403);
  });

  it('absent origin proceeds', async () => {
    const res = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${env.MCP_INTERNAL_API_KEY}`)
      .send({});
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });

  it('GET /mcp returns 405', async () => {
    const res = await request(app).get('/mcp');
    expect(res.status).toBe(405);
    expect(res.headers['allow']).toBe('POST');
  });

  it('DELETE /mcp returns 405', async () => {
    const res = await request(app).delete('/mcp');
    expect(res.status).toBe(405);
    expect(res.headers['allow']).toBe('POST');
  });

  it('response headers contain request ID and safe headers', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('no secret appears in responses', async () => {
    const res = await request(app).get('/health');
    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain(env.TMDB_API_KEY);
    expect(bodyStr).not.toContain(env.MCP_INTERNAL_API_KEY);
  });
});
