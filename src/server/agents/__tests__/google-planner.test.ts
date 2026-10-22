// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGooglePlanner } from '../google-planner';
import { createBudgetedGoogleFetch } from '../google-planner.fetch';
import { ORCHESTRATOR_MODEL, orchestratorLimitsSchema } from '../orchestrator.schemas';

const baseURL = `https://generativelanguage.googleapis.com/v1beta/models/${ORCHESTRATOR_MODEL}`;
const decision = { intent: 'search', queries: ['Example'], movieId: null, window: null };
const json = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });
const success = (overrides: Record<string, unknown> = {}) => ({
  candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify(decision) }] }, finishReason: 'STOP' }],
  usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 40, totalTokenCount: 140 },
  ...overrides,
});
const options = () => ({ signal: new AbortController().signal, limits: orchestratorLimitsSchema.parse({}) });

describe('Google planner with real AI SDK and mock HTTP only', () => {
  let fetch: ReturnType<typeof vi.fn<typeof globalThis.fetch>>;
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Live HTTP forbidden in tests'); }));
    fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async input => {
      if (String(input) === `${baseURL}:countTokens`) return json({ totalTokens: 100 });
      if (String(input) === `${baseURL}:generateContent`) return json(success());
      throw new Error('Unexpected endpoint');
    });
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
  const make = (fetch: typeof globalThis.fetch) => createGooglePlanner({ fetch, apiKey: 'synthetic-test-key', freeTierConfirmed: true });

  it('counts the exact SDK request before the single approved-model generation', async () => {
    const runtime = options();
    expect(await make(fetch)({ message: 'Find Example' }, runtime)).toEqual({ decision, usage: { inputTokens: 100, outputTokens: 40, totalTokens: 140 } });
    expect(fetch).toHaveBeenCalledTimes(2);
    const [count, generation] = fetch.mock.calls;
    expect(count[0]).toBe(`${baseURL}:countTokens`);
    expect(generation[0]).toBe(`${baseURL}:generateContent`);
    const body = JSON.parse(generation[1]!.body as string);
    expect(JSON.parse(count[1]!.body as string)).toEqual({ generateContentRequest: { ...body, model: `models/${ORCHESTRATOR_MODEL}` } });
    expect(body).toMatchObject({
      contents: [{ role: 'user', parts: [{ text: JSON.stringify({ message: 'Find Example' }) }] }],
      systemInstruction: { parts: [{ text: expect.stringContaining('untrusted data') }] },
      generationConfig: {
        maxOutputTokens: 512, responseMimeType: 'application/json', responseSchema: expect.any(Object),
        thinkingConfig: { thinkingLevel: 'minimal', includeThoughts: false },
      },
    });
    expect(body).not.toHaveProperty('tools');
    for (const [, init] of fetch.mock.calls) {
      expect(init?.redirect).toBe('error');
      expect(init?.signal).toBe(runtime.signal);
      expect(new Headers(init?.headers).get('x-goog-api-key')).toBe('synthetic-test-key');
    }
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('is inert until Free Tier approval and never reads the key into a public result', async () => {
    const planner = createGooglePlanner({ fetch, apiKey: 'synthetic-test-key' });
    await expect(planner({ message: 'find' }, options())).rejects.toMatchObject({ code: 'provider_disabled' });
    expect(fetch).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('uses only the canonical server key and rejects missing configuration without HTTP', async () => {
    vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', '');
    await expect(createGooglePlanner({ fetch, freeTierConfirmed: true })({ message: 'find' }, options())).rejects.toMatchObject({ code: 'provider_auth' });
    expect(fetch).not.toHaveBeenCalled();
    vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', 'canonical-synthetic-key');
    await createGooglePlanner({ fetch, freeTierConfirmed: true })({ message: 'find' }, options());
    expect(new Headers(fetch.mock.calls[0][1]?.headers).get('x-goog-api-key')).toBe('canonical-synthetic-key');
  });

  it.each([
    [4097, {}, 'token_budget_exceeded'], [100, { maxTotalTokens: 600 }, 'token_budget_exceeded'],
    [101, { maxInputTokens: 100 }, 'token_budget_exceeded'],
    [0, {}, 'invalid_provider_usage'], ['100', {}, 'invalid_provider_usage'], [null, {}, 'invalid_provider_usage'],
  ])('blocks generation at preflight count %j and limits %j', async (totalTokens, limits, code) => {
    fetch.mockResolvedValue(json({ totalTokens }));
    await expect(make(fetch)({ message: 'find' }, { ...options(), limits: orchestratorLimitsSchema.parse(limits) })).rejects.toMatchObject({ code });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('accepts exact input/total ceilings without another provider call', async () => {
    fetch.mockResolvedValueOnce(json({ totalTokens: 4096 })).mockResolvedValueOnce(json(success({
      usageMetadata: { promptTokenCount: 4096, candidatesTokenCount: 512, totalTokenCount: 4608 },
    })));
    await expect(make(fetch)({ message: 'find' }, options())).resolves.toMatchObject({ usage: { inputTokens: 4096, outputTokens: 512, totalTokens: 4608 } });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each([401, 403, 429, 500, 503])('does not retry or switch models after generation HTTP %i', async status => {
    fetch.mockResolvedValueOnce(json({ totalTokens: 100 })).mockResolvedValueOnce(json({ error: { code: status, message: 'private upstream details', status: 'ERROR' } }, status));
    let caught: unknown;
    try { await make(fetch)({ message: 'find' }, options()); } catch (error) { caught = error; }
    expect(caught).toMatchObject({ code: status === 429 ? 'provider_quota' : status === 401 || status === 403 ? 'provider_auth' : 'provider_unavailable' });
    expect(String(caught)).not.toContain('private upstream');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each([401, 403, 429, 503])('fails closed on preflight HTTP %i without generation', async status => {
    fetch.mockResolvedValueOnce(json({ error: { message: 'private' } }, status));
    await expect(make(fetch)({ message: 'find' }, options())).rejects.toMatchObject({ code: status === 429 ? 'provider_quota' : status === 503 ? 'provider_unavailable' : 'provider_auth' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('does not retry network failures', async () => {
    fetch.mockRejectedValue(new Error('private transport headers'));
    await expect(make(fetch)({ message: 'find' }, options())).rejects.toMatchObject({ code: 'provider_unavailable' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    'raw unstructured prose', JSON.stringify({ ...decision, raw: 'private' }),
    JSON.stringify({ ...decision, queries: ['api_key=private'] }),
  ])('rejects invalid structured model output without repair/retry: %s', async text => {
    fetch.mockResolvedValueOnce(json({ totalTokens: 100 })).mockResolvedValueOnce(json(success({
      candidates: [{ content: { role: 'model', parts: [{ text }] }, finishReason: 'STOP' }],
    })));
    await expect(make(fetch)({ message: 'find' }, options())).rejects.toMatchObject({ code: 'invalid_plan' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each([
    undefined,
    { promptTokenCount: 4097, candidatesTokenCount: 40, totalTokenCount: 4137 },
    { promptTokenCount: 100, candidatesTokenCount: 513, totalTokenCount: 613 },
    { promptTokenCount: 100, candidatesTokenCount: 500, thoughtsTokenCount: 20, totalTokenCount: 620 },
  ])('requires valid usage within budgets, including reasoning tokens: %j', async usageMetadata => {
    fetch.mockResolvedValueOnce(json({ totalTokens: 100 })).mockResolvedValueOnce(json(success({ usageMetadata })));
    await expect(make(fetch)({ message: 'find' }, options())).rejects.toMatchObject({ code: usageMetadata === undefined ? 'invalid_provider_usage' : 'token_budget_exceeded' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('blocks automatic SDK continuations as well as explicit retries', async () => {
    fetch.mockResolvedValueOnce(json({ totalTokens: 100 })).mockResolvedValueOnce(json(success({
      candidates: [{ content: { role: 'model', parts: [{ text: '{' }] }, finishReason: 'CONTINUATION', continuationToken: 'private' }],
    })));
    await expect(make(fetch)({ message: 'find' }, options())).rejects.toMatchObject({ code: 'provider_unavailable' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('does not generate if cancellation arrives between counting and generation', async () => {
    const controller = new AbortController();
    fetch.mockImplementation(async () => { controller.abort(); return json({ totalTokens: 100 }); });
    await expect(make(fetch)({ message: 'find' }, { ...options(), signal: controller.signal })).rejects.toMatchObject({ code: 'cancelled' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each(['https://elsewhere.test/generateContent', `${baseURL}:streamGenerateContent`, `${baseURL.replace(ORCHESTRATOR_MODEL, 'other-model')}:generateContent`])(
    'rejects unexpected request destinations: %s', async url => {
      const runtime = options();
      const guarded = createBudgetedGoogleFetch(fetch, runtime.signal, runtime.limits);
      await expect(guarded(url, { method: 'POST', body: '{}' })).rejects.toMatchObject({ code: 'provider_unavailable' });
      expect(fetch).not.toHaveBeenCalled();
    },
  );
});
