// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../../../app/api/ai/search/route';
import { approvedPresentation } from '@/lib/ai/__tests__/fixtures';
import { readAiStream } from '@/lib/ai/read-stream';
import { createAiSearchHandler } from '../search-handler';
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
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Live HTTP forbidden in tests'); }));
    run = vi.fn<typeof runOrchestrator>().mockImplementation(async (_, options) => {
      options?.onProgress?.('planning'); options?.onProgress?.('searching'); options?.onProgress?.('validating');
      return completed;
    });
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

  it('streams only schema-validated progress and Quality presentation, without usage/plans/envelopes', async () => {
    const response = await createAiSearchHandler({ enabled: true, run })(request());
    expect(response.headers.get('cache-control')).toBe('no-store, no-transform');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    const text = await response.text();
    expect(text.split('\n').filter(Boolean).map(line => JSON.parse(line).type)).toEqual(['progress', 'progress', 'progress', 'result']);
    expect(text).not.toMatch(/usage|inputTokens|model|outcomes|toolCalls/);
    expect(run).toHaveBeenCalledWith({ message: 'Find a movie' }, { signal: expect.any(AbortSignal), onProgress: expect.any(Function) });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('keeps the actual public route disabled regardless of configured credentials', async () => {
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await parse(response)).toEqual({ type: 'error', code: 'disabled' });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('does not invoke even an injected runner when the server gate is disabled', async () => {
    expect(await parse(await createAiSearchHandler({ enabled: false, run })(request()))).toEqual({ type: 'error', code: 'disabled' });
    expect(run).not.toHaveBeenCalled();
  });

  it('uses the actual Host when standalone Next normalizes Request.url to localhost', async () => {
    const req = request(undefined, { headers: { host: '127.0.0.1', origin: 'http://127.0.0.1', 'content-type': 'application/json' } });
    expect(await parse(await createAiSearchHandler({ enabled: false, run })(req))).toEqual({ type: 'error', code: 'disabled' });
    expect(run).not.toHaveBeenCalled();
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
  });

  it.each([
    {}, { message: '' }, { message: 'x'.repeat(1001) }, { message: 'find', freeTierConfirmed: true },
    { message: 'find', evidence: {} }, { message: 'find', options: {} },
  ])('rejects untrusted request extensions/invalid data: %j', async input => {
    const response = await createAiSearchHandler({ enabled: true, run })(request(input));
    expect(response.status).toBe(400);
    expect(run).not.toHaveBeenCalled();
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
});
