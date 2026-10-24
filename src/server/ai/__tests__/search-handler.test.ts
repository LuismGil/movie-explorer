// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../../../app/api/ai/search/route';
import { approvedPresentation } from '@/lib/ai/__tests__/fixtures';
import { readAiStream } from '@/lib/ai/read-stream';
import { createAiSearchHandler as createHandler } from '../search-handler';
import type { AiRateLimiter } from '../rate-limit';
import { runOrchestrator } from '../../agents/orchestrator';
import type { OrchestratorResult } from '../../agents/orchestrator.schemas';

const usage = { plannerCalls: 1, toolCallsReserved: 1, inputTokens: 100, outputTokens: 40, totalTokens: 140 };
const completed: OrchestratorResult = { status: 'completed', intent: 'search', presentation: approvedPresentation, usage };
const request = (body: unknown = { message: 'Find a movie' }, overrides: RequestInit = {}) => new Request('http://localhost/api/ai/search', {
  method: 'POST', headers: { Origin: 'http://localhost', 'Content-Type': 'application/json' }, body: JSON.stringify(body), ...overrides,
});
const parse = (response: Response) => readAiStream(response, () => {}, new AbortController().signal);

describe('same-origin AI streaming boundary', () => {
  let run: ReturnType<typeof vi.fn<typeof runOrchestrator>>;
  let rateLimit: ReturnType<typeof vi.fn<AiRateLimiter>>;
  const createAiSearchHandler = (options: Parameters<typeof createHandler>[0]) => createHandler({ rateLimit, ...options });
  beforeEach(() => {
    rateLimit = vi.fn<AiRateLimiter>().mockResolvedValue({ status: 'allowed' });
    vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Live HTTP forbidden in tests'); }));
    run = vi.fn<typeof runOrchestrator>().mockImplementation(async (_, options) => {
      options?.onProgress?.('planning'); options?.onProgress?.('searching'); options?.onProgress?.('validating');
      return completed;
    });
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });

  it('streams only schema-validated progress and Quality presentation, without usage/plans/envelopes', async () => {
    const response = await createAiSearchHandler({ enabled: true, run })(request());
    expect(response.headers.get('cache-control')).toBe('no-store, no-transform');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    const text = await response.text();
    expect(text.split('\n').filter(Boolean).map(line => JSON.parse(line).type)).toEqual(['progress', 'progress', 'progress', 'result']);
    expect(text).not.toMatch(/usage|inputTokens|model|outcomes|toolCalls/);
    expect(run).toHaveBeenCalledWith({ message: 'Find a movie' }, { signal: expect.any(AbortSignal), onProgress: expect.any(Function) });
    expect(rateLimit).toHaveBeenCalledTimes(1);
    expect(rateLimit.mock.invocationCallOrder[0]).toBeLessThan(run.mock.invocationCallOrder[0]);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('keeps the actual public route disabled regardless of configured credentials', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://test-db.upstash.io');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'synthetic-rest-token-with-at-least-32-characters');
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await parse(response)).toEqual({ type: 'error', code: 'disabled' });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('does not invoke even an injected runner when the server gate is disabled', async () => {
    expect(await parse(await createAiSearchHandler({ enabled: false, run })(request()))).toEqual({ type: 'error', code: 'disabled' });
    expect(run).not.toHaveBeenCalled();
    expect(rateLimit).not.toHaveBeenCalled();
  });

  it('uses the actual Host when standalone Next normalizes Request.url to localhost', async () => {
    const req = request(undefined, { headers: { host: '127.0.0.1', origin: 'http://127.0.0.1', 'content-type': 'application/json' } });
    expect(await parse(await createAiSearchHandler({ enabled: false, run })(req))).toEqual({ type: 'error', code: 'disabled' });
    expect(run).not.toHaveBeenCalled();
    expect(rateLimit).not.toHaveBeenCalled();
  });

  it.each([
    { origin: 'https://attacker.test', 'content-type': 'application/json' },
    { 'content-type': 'application/json' },
    { origin: 'http://localhost', 'content-type': 'text/plain' },
    { origin: 'http://localhost', 'content-type': 'application/json', 'sec-fetch-site': 'cross-site' },
    { origin: 'http://localhost', 'content-type': 'application/json', 'content-length': '8193' },
    { origin: 'https://attacker.test', host: 'localhost', 'x-forwarded-host': 'attacker.test', 'content-type': 'application/json' },
  ])('rejects unsafe transport headers before orchestration: %j', async headers => {
    const transportHeaders = new Headers();
    for (const [key, value] of Object.entries(headers)) if (value !== undefined) transportHeaders.set(key, value);
    const response = await createAiSearchHandler({ enabled: true, run })(request(undefined, { headers: transportHeaders }));
    expect(response.ok).toBe(false);
    expect(await parse(response)).toEqual({ type: 'error', code: 'invalid_request' });
    expect(run).not.toHaveBeenCalled();
    expect(rateLimit).not.toHaveBeenCalled();
  });

  it.each([
    {}, { message: '' }, { message: 'x'.repeat(1001) }, { message: 'find', freeTierConfirmed: true },
    { message: 'find', evidence: {} }, { message: 'find', options: {} },
    { message: 'find', rateLimit: { status: 'allowed' } }, { message: 'find', limits: { maximum: 100 } },
  ])('rejects untrusted request extensions/invalid data: %j', async input => {
    const response = await createAiSearchHandler({ enabled: true, run })(request(input));
    expect(response.status).toBe(400);
    expect(run).not.toHaveBeenCalled();
    expect(rateLimit).not.toHaveBeenCalled();
  });

  it.each(['{', 'x'.repeat(8193)])('bounds/parses actual body bytes even without Content-Length', async body => {
    expect((await createAiSearchHandler({ enabled: true, run })(request(undefined, { body }))).status).toBe(400);
    expect(run).not.toHaveBeenCalled();
  });

  it.each([
    ['provider_auth', 'unavailable'], ['provider_quota', 'quota_exceeded'], ['provider_disabled', 'disabled'],
    ['quality_rejected', 'unsafe_result'], ['deadline_exceeded', 'timeout'],
  ] as const)('maps %s to the static public code %s', async (code, publicCode) => {
    run.mockResolvedValue({ status: 'failed', code, usage });
    expect(await parse(await createAiSearchHandler({ enabled: true, run })(request()))).toEqual({ type: 'error', code: publicCode });
  });

  it('never includes raw thrown errors', async () => {
    run.mockRejectedValue(new Error('private prompt and Bearer credential'));
    const text = await (await createAiSearchHandler({ enabled: true, run })(request())).text();
    expect(text).toBe('{"type":"error","code":"unavailable"}\n');
  });

  it('rejects invalid runner output or extra private fields instead of serializing it', async () => {
    run.mockResolvedValue({ ...completed, raw: 'private' } as OrchestratorResult);
    expect(await parse(await createAiSearchHandler({ enabled: true, run })(request()))).toEqual({ type: 'error', code: 'unavailable' });
  });

  it('cancels the runner when the response consumer disconnects', async () => {
    run.mockImplementation(async () => new Promise(() => {}));
    const response = await createAiSearchHandler({ enabled: true, run })(request());
    await response.body!.cancel();
    expect(run.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });

  it('returns a controlled timeout for a runner that ignores abort', async () => {
    vi.useFakeTimers();
    run.mockImplementation(async () => new Promise(() => {}));
    const response = await createAiSearchHandler({ enabled: true, run })(request());
    const result = parse(response);
    await vi.advanceTimersByTimeAsync(35000);
    expect(await result).toEqual({ type: 'error', code: 'timeout' });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('bounds a stalled incoming request body', async () => {
    vi.useFakeTimers();
    const pending = createAiSearchHandler({ enabled: true, run })(request(undefined, {
      body: new ReadableStream(), duplex: 'half',
    } as RequestInit));
    await vi.advanceTimersByTimeAsync(35000);
    expect(await parse(await pending)).toEqual({ type: 'error', code: 'timeout' });
    expect(run).not.toHaveBeenCalled();
  });

  it('integrates the real Orchestrator and Quality gate with mocked planning/Search only', async () => {
    const handler = createAiSearchHandler({ enabled: true, run: (input, options) => runOrchestrator(input, {
      ...options,
      planner: async () => ({ decision: { intent: 'search', queries: ['Example'], movieId: null, window: null }, usage: { inputTokens: 100, outputTokens: 40, totalTokens: 140 } }),
      searchAgent: async () => ({
        status: 'complete', details: [], credits: [],
        movies: [{ id: 42, title: 'Example', overview: 'From server evidence', poster_path: null }],
        outcomes: [{ callIndex: 0, tool: 'search_movies', status: 'succeeded', itemCount: 1 }],
      }),
    }) });
    expect(await parse(await handler(request()))).toMatchObject({ type: 'result', status: 'completed', presentation: { movies: [{ id: 42, title: 'Example' }] } });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('returns 429 with Retry-After and a static event before invoking any pipeline stage', async () => {
    rateLimit.mockResolvedValue({ status: 'limited', retryAfterSeconds: 86_400 });
    const response = await createAiSearchHandler({ enabled: true, run })(request());
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('86400');
    expect(response.headers.get('cache-control')).toBe('no-store, no-transform');
    expect(await parse(response)).toEqual({ type: 'error', code: 'rate_limited' });
    expect(rateLimit).toHaveBeenCalledWith(expect.any(AbortSignal));
    expect(run).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('fails closed without Upstash configuration even with a server-enabled mock runner', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', ''); vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    const response = await createHandler({ enabled: true, run })(request());
    expect(response.status).toBe(503);
    expect(await parse(response)).toEqual({ type: 'error', code: 'unavailable' });
    expect(run).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('does not turn limiter errors or malformed decisions into an allowed request', async () => {
    for (const value of [{ status: 'unavailable' }, { status: 'allowed', raw: 'private' }, { status: 'limited', retryAfterSeconds: -1 }, undefined]) {
      rateLimit.mockResolvedValue(value as Awaited<ReturnType<AiRateLimiter>>);
      const response = await createAiSearchHandler({ enabled: true, run })(request());
      expect(response.status).toBe(503);
      expect(await parse(response)).toEqual({ type: 'error', code: 'unavailable' });
    }
    rateLimit.mockRejectedValue(new Error('private Upstash credential'));
    expect(await (await createAiSearchHandler({ enabled: true, run })(request())).text()).toBe('{"type":"error","code":"unavailable"}\n');
    expect(run).not.toHaveBeenCalled();
  });

  it('bounds an uncooperative injected limiter and never starts orchestration afterward', async () => {
    vi.useFakeTimers();
    let finish!: (decision: { status: 'allowed' }) => void;
    rateLimit.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const pending = createAiSearchHandler({ enabled: true, run })(request());
    await vi.advanceTimersByTimeAsync(2000);
    expect(await parse(await pending)).toEqual({ type: 'error', code: 'unavailable' });
    finish({ status: 'allowed' });
    await Promise.resolve();
    expect(run).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not retry or refund an admission when the pipeline fails', async () => {
    run.mockRejectedValue(new Error('private provider failure'));
    expect(await parse(await createAiSearchHandler({ enabled: true, run })(request()))).toEqual({ type: 'error', code: 'unavailable' });
    expect(rateLimit).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('never continues to the pipeline when the caller cancels during admission', async () => {
    const controller = new AbortController();
    rateLimit.mockImplementation(() => new Promise(() => {}));
    const pending = createAiSearchHandler({ enabled: true, run })(request(undefined, { signal: controller.signal }));
    await vi.waitFor(() => expect(rateLimit).toHaveBeenCalledTimes(1));
    controller.abort();
    expect(await parse(await pending)).toEqual({ type: 'error', code: 'cancelled' });
    expect(rateLimit.mock.calls[0][0].aborted).toBe(true);
    expect(run).not.toHaveBeenCalled();
  });
});
