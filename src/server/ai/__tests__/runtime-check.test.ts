// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../../../app/api/internal/runtime-check/route';
import type { runSearchAgent } from '../../agents/search-agent';
import { createRuntimeCheckHandler } from '../runtime-check';
import { AI_ADMISSION_KEY } from '../rate-limit.script';

const secret = 'synthetic-operator-token-with-at-least-32-characters';
const env = {
  AI_RUNTIME_CHECK_API_KEY: secret,
  UPSTASH_REDIS_REST_URL: 'https://test-db.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'synthetic-rest-token-with-at-least-32-characters',
  MCP_SERVER_URL: 'https://movie-explorer-ppc2.onrender.com/mcp',
  MCP_INTERNAL_API_KEY: 'synthetic-mcp-token-with-at-least-32-characters',
};
const completed = {
  status: 'complete' as const,
  movies: [{ id: 27205, title: 'Private fixture title', overview: 'Private fixture overview', poster_path: null }],
  details: [], credits: [],
  outcomes: [{ status: 'succeeded' as const, callIndex: 0, tool: 'search_movies' as const, itemCount: 1 }],
};
const request = (init: RequestInit = {}, query = '') => new Request(`https://demo.test/api/internal/runtime-check${query}`, {
  method: 'POST', headers: { Authorization: `Bearer ${secret}` }, ...init,
});

describe('temporary operator-only runtime dependency check', () => {
  let fetch: ReturnType<typeof vi.fn<typeof globalThis.fetch>>;
  let search: ReturnType<typeof vi.fn<typeof runSearchAgent>>;
  beforeEach(() => {
    fetch = vi.fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(Response.json({ result: 'PONG' }))
      .mockResolvedValueOnce(Response.json({ result: 1 }));
    search = vi.fn<typeof runSearchAgent>().mockResolvedValue(completed);
    vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Live HTTP forbidden in tests'); }));
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });
  const handler = (configuration: Readonly<Record<string, string | undefined>> = env) => createRuntimeCheckHandler({ env: configuration, fetch, search });

  it('keeps the actual route inert when its optional operator secret is unset', async () => {
    vi.stubEnv('AI_RUNTIME_CHECK_API_KEY', '');
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'unavailable' });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it.each(['', 'short', 'x'.repeat(257), `${'x'.repeat(32)}\n`])('fails closed for invalid operator secret %#', async value => {
    expect((await handler({ ...env, AI_RUNTIME_CHECK_API_KEY: value })(request())).status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
    expect(search).not.toHaveBeenCalled();
  });

  it.each(['', 'Basic private', 'Bearer wrong', `Bearer ${'x'.repeat(secret.length)}`, `Bearer ${secret} extra`])('rejects unauthorized callers without outbound work %#', async authorization => {
    const response = await handler()(request({ headers: { Authorization: authorization } }));
    expect(response.status).toBe(401);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ error: 'unauthorized' });
    expect(fetch).not.toHaveBeenCalled();
    expect(search).not.toHaveBeenCalled();
  });

  it('does not authorize a query-string token or a token in the body', async () => {
    expect((await handler()(request({ headers: {}, body: JSON.stringify({ token: secret }) }, `?token=${secret}`))).status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
    expect(search).not.toHaveBeenCalled();
  });

  it('accepts no request-supplied query, body, or operation', async () => {
    expect((await handler()(request({ method: 'GET' }))).status).toBe(405);
    expect((await handler()(request({}, '?target=https://attacker.test'))).status).toBe(400);
    expect((await handler()(request({ body: JSON.stringify({ target: 'https://attacker.test', message: 'private' }) }))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
    expect(search).not.toHaveBeenCalled();
  });

  it.each([
    { ...env, UPSTASH_REDIS_REST_URL: 'not a url' },
    ...['http://test-db.upstash.io', 'https://attacker.test', 'https://user:password@test-db.upstash.io',
      'https://test-db.upstash.io:8443', 'https://test-db.upstash.io/path', 'https://test-db.upstash.io?secret=x',
    ].map(url => ({ ...env, UPSTASH_REDIS_REST_URL: url })),
    { ...env, UPSTASH_REDIS_REST_TOKEN: '' },
    { ...env, MCP_SERVER_URL: 'http://127.0.0.1:3001/mcp' },
    { ...env, MCP_SERVER_URL: 'https://attacker.test/mcp' },
    { ...env, MCP_SERVER_URL: `${env.MCP_SERVER_URL}?token=private` },
    { ...env, MCP_INTERNAL_API_KEY: '' },
  ])('rejects missing/unsafe dependency configuration without outbound work %#', async configuration => {
    expect((await handler(configuration)(request())).status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
    expect(search).not.toHaveBeenCalled();
  });

  it('checks only isolated Upstash state and one fixed search, returning aggregate results', async () => {
    const response = await handler()(request());
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    const result = await response.json();
    expect(result).toEqual({
      status: 'passed', elapsedMs: expect.any(Number), checks: {
        upstash: { status: 'passed', elapsedMs: expect.any(Number) }, mcp: { status: 'passed', elapsedMs: expect.any(Number) },
      },
    });
    expect(JSON.stringify(result)).not.toMatch(/private|fixture|token|27205|Inception|overview|api_key/i);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetch.mock.calls[0][1]!.body as string)).toEqual(['PING']);
    const command = JSON.parse(fetch.mock.calls[1][1]!.body as string);
    expect(command).toEqual(['EVAL', expect.any(String), 1, expect.stringMatching(/^movie-explorer:diagnostic:runtime:[a-f0-9-]{36}$/), expect.any(String)]);
    expect(command[1]).toContain("'NX', 'EX', 5");
    expect(command[3]).not.toBe(AI_ADMISSION_KEY);
    for (const [url, options] of fetch.mock.calls) {
      expect(url).toBe(env.UPSTASH_REDIS_REST_URL);
      expect(options).toMatchObject({ method: 'POST', redirect: 'error', cache: 'no-store', credentials: 'omit', signal: expect.any(AbortSignal) });
    }
    expect(search).toHaveBeenCalledExactlyOnceWith({ calls: [{ tool: 'search_movies', query: 'Inception', page: 1 }] }, {
      signal: expect.any(AbortSignal), timeoutMs: 10000, maxToolCalls: 1,
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('uses a new isolated key per operator invocation', async () => {
    await handler()(request());
    fetch.mockResolvedValueOnce(Response.json({ result: 'PONG' })).mockResolvedValueOnce(Response.json({ result: 1 }));
    await handler()(request());
    const first = JSON.parse(fetch.mock.calls[1][1]!.body as string)[3];
    const second = JSON.parse(fetch.mock.calls[3][1]!.body as string)[3];
    expect(first).not.toBe(second);
  });

  it.each([302, 401, 429, 500])('does not follow redirects or retry storage HTTP %d', async status => {
    fetch.mockReset().mockResolvedValue(Response.json({ error: 'private' }, { status }));
    const response = await handler()(request());
    expect(response.status).toBe(503);
    expect((await response.json()).checks).toMatchObject({ upstash: { status: 'failed' }, mcp: { status: 'passed' } });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledTimes(1);
  });

  it.each([
    () => Response.json({ result: 'PONG', raw: 'private' }),
    () => Response.json({ result: 'incorrect' }),
    () => new Response('x'.repeat(1025), { headers: { 'Content-Type': 'application/json' } }),
    () => new Response(Uint8Array.of(255), { headers: { 'Content-Type': 'application/json' } }),
    () => new Response('{"result":"PONG"}', { headers: { 'Content-Type': 'text/html' } }),
  ])('rejects malformed, oversized or unsafe storage response %#', async reply => {
    fetch.mockReset().mockResolvedValue(reply());
    const response = await handler()(request());
    expect((await response.json()).checks.upstash.status).toBe('failed');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('checks the EVAL result instead of treating any successful HTTP response as a pass', async () => {
    fetch.mockReset().mockResolvedValueOnce(Response.json({ result: 'PONG' })).mockResolvedValueOnce(Response.json({ result: 'PONG' }));
    expect((await (await handler()(request())).json()).checks.upstash.status).toBe('failed');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('does not expose or log thrown errors and does not retry the MCP request', async () => {
    search.mockRejectedValue(new Error(`Bearer ${secret}: private movie payload`));
    const log = vi.spyOn(console, 'error');
    try {
      const response = await handler()(request());
      expect(response.status).toBe(503);
      expect((await response.json()).checks.mcp.status).toBe('failed');
      expect(search).toHaveBeenCalledTimes(1);
      expect(log).not.toHaveBeenCalled();
    } finally { log.mockRestore(); }
  });

  it.each([
    { ...completed, status: 'failed' as const },
    { ...completed, movies: [] },
    { ...completed, outcomes: [] },
    { ...completed, outcomes: [{ ...completed.outcomes[0], tool: 'get_trending' as const }] },
  ])('rejects an incomplete or mismatched search result %#', async result => {
    search.mockResolvedValue(result);
    expect((await (await handler()(request())).json()).checks.mcp.status).toBe('failed');
  });

  it('bounds a stalled storage request to two seconds without retries', async () => {
    vi.useFakeTimers();
    fetch.mockReset().mockImplementation(() => new Promise(() => {}));
    const pending = handler()(request());
    await vi.advanceTimersByTimeAsync(2000);
    const result = await (await pending).json();
    expect(result.checks).toMatchObject({ upstash: { status: 'failed' }, mcp: { status: 'passed' } });
    expect(fetch.mock.calls[0][1]!.signal!.aborted).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('bounds stalled storage response bodies as well as fetch', async () => {
    vi.useFakeTimers();
    fetch.mockReset().mockResolvedValue(new Response(new ReadableStream(), { headers: { 'Content-Type': 'application/json' } }));
    const pending = handler()(request());
    await vi.advanceTimersByTimeAsync(2000);
    expect((await (await pending).json()).checks.upstash.status).toBe('failed');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('bounds the full check if the MCP dependency ignores cancellation', async () => {
    vi.useFakeTimers();
    search.mockImplementation(() => new Promise(() => {}));
    const pending = handler()(request());
    await vi.advanceTimersByTimeAsync(30_000);
    expect((await (await pending).json()).checks).toMatchObject({ upstash: { status: 'passed' }, mcp: { status: 'failed' } });
    expect(search.mock.calls[0][1]!.signal!.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('starts no dependency requests for an already cancelled invocation', async () => {
    const response = await handler()(request({ signal: AbortSignal.abort() }));
    expect((await response.json()).checks).toMatchObject({ upstash: { status: 'not_run' }, mcp: { status: 'not_run' } });
    expect(fetch).not.toHaveBeenCalled();
    expect(search).not.toHaveBeenCalled();
  });
});
