// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAiRateLimiter } from '../rate-limit';
import { AI_ADMISSION_KEY, AI_ADMISSION_SCRIPT } from '../rate-limit.script';

const env = { UPSTASH_REDIS_REST_URL: 'https://test-db.upstash.io', UPSTASH_REDIS_REST_TOKEN: 'synthetic-rest-token-with-at-least-32-characters' };
const response = (value: unknown, status = 200) => Response.json(value, { status });
const signal = () => new AbortController().signal;

describe('free-tier distributed AI admission adapter', () => {
  afterEach(() => vi.useRealTimers());

  it('makes one atomic, uncached, bounded request with fixed limits and no user data', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(response({ result: [1, 0] }));
    const limiter = createAiRateLimiter({ env, fetch });
    expect(fetch).not.toHaveBeenCalled();
    expect(await limiter(signal())).toEqual({ status: 'allowed' });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(env.UPSTASH_REDIS_REST_URL);
    expect(init).toMatchObject({ method: 'POST', cache: 'no-store', redirect: 'error', credentials: 'omit', signal: expect.any(AbortSignal) });
    expect(JSON.parse(init!.body as string)).toEqual(['EVAL', AI_ADMISSION_SCRIPT, 1, AI_ADMISSION_KEY, 60_000, 86_400_000, 10]);
    expect(init!.body).not.toMatch(/message|prompt|movieId|cookie|forwarded|ip_address/);
  });

  it.each([1, 60, 86_400])('returns bounded retry-after seconds: %d', async seconds => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(response({ result: [0, seconds] }));
    expect(await createAiRateLimiter({ env, fetch })(signal())).toEqual({ status: 'limited', retryAfterSeconds: seconds });
  });

  it.each([
    {}, { ...env, UPSTASH_REDIS_REST_TOKEN: '' }, { ...env, UPSTASH_REDIS_REST_TOKEN: 'x' },
    { ...env, UPSTASH_REDIS_REST_TOKEN: 'x'.repeat(4097) },
    { ...env, UPSTASH_REDIS_REST_TOKEN: 'x'.repeat(32) + '\nheader' },
    ...['not a url', 'http://test-db.upstash.io', 'https://attacker.test', 'https://upstash.io.attacker.test',
      'https://test-db.upstash.io:8443', 'https://test-db.upstash.io/path', 'https://test-db.upstash.io?token=secret',
      'https://user:password@test-db.upstash.io', 'https://test-db.upstash.io#fragment', 'https://127.0.0.1',
    ].map(url => ({ ...env, UPSTASH_REDIS_REST_URL: url })),
  ])('fails closed on missing/unsafe configuration without HTTP: %#', async configuration => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    expect(await createAiRateLimiter({ env: configuration, fetch })(signal())).toEqual({ status: 'unavailable' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    { error: 'private backend error' }, { result: [2, 0] }, { result: [1, 60] }, { result: [0, 0] },
    { result: [0, -1] }, { result: [0, 86_401] }, { result: [0, 1.5] }, { result: ['1', 0] },
    { result: [1, 0, 'extra'] }, { result: [1, 0], raw: 'private' }, null,
  ])('rejects invalid backend envelopes without accepting an admission: %j', async value => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(response(value));
    expect(await createAiRateLimiter({ env, fetch })(signal())).toEqual({ status: 'unavailable' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([302, 401, 429, 500])('does not retry or fail open on HTTP %d', async status => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(response({ error: 'private' }, status));
    expect(await createAiRateLimiter({ env, fetch })(signal())).toEqual({ status: 'unavailable' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('sanitizes exceptions without logging them or making a second attempt', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue(new Error('Bearer private-token'));
    const log = vi.spyOn(console, 'error');
    try {
      expect(await createAiRateLimiter({ env, fetch })(signal())).toEqual({ status: 'unavailable' });
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(log).not.toHaveBeenCalled();
    } finally { log.mockRestore(); }
  });

  it('does not start HTTP for an already cancelled caller', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    expect(await createAiRateLimiter({ env, fetch })(AbortSignal.abort())).toEqual({ status: 'unavailable' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('stops waiting after two seconds even if fetch ignores abort', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(() => new Promise(() => {}));
    const pending = createAiRateLimiter({ env, fetch })(signal());
    await vi.advanceTimersByTimeAsync(2000);
    expect(await pending).toEqual({ status: 'unavailable' });
    expect(fetch.mock.calls[0][1]!.signal!.aborted).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('stops waiting and aborts HTTP when the caller disconnects', async () => {
    const controller = new AbortController();
    const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(() => new Promise(() => {}));
    const pending = createAiRateLimiter({ env, fetch })(controller.signal);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    controller.abort();
    expect(await pending).toEqual({ status: 'unavailable' });
    expect(fetch.mock.calls[0][1]!.signal!.aborted).toBe(true);
  });

  it('bounds actual response bytes and rejects invalid UTF-8/media types', async () => {
    for (const reply of [
      new Response('x'.repeat(1025), { headers: { 'Content-Type': 'application/json' } }),
      new Response(Uint8Array.of(0xff), { headers: { 'Content-Type': 'application/json' } }),
      new Response(JSON.stringify({ result: [1, 0] }), { headers: { 'Content-Type': 'text/html' } }),
    ]) {
      const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(reply);
      expect(await createAiRateLimiter({ env, fetch })(signal())).toEqual({ status: 'unavailable' });
      expect(fetch).toHaveBeenCalledTimes(1);
    }
  });

  it('bounds stalled response bodies as well as the initial HTTP request', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response(new ReadableStream(), {
      headers: { 'Content-Type': 'application/json' },
    }));
    const pending = createAiRateLimiter({ env, fetch })(signal());
    await vi.advanceTimersByTimeAsync(2000);
    expect(await pending).toEqual({ status: 'unavailable' });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects an unexpectedly redirected response even from an injected transport', async () => {
    const reply = response({ result: [1, 0] });
    Object.defineProperty(reply, 'redirected', { value: true });
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(reply);
    expect(await createAiRateLimiter({ env, fetch })(signal())).toEqual({ status: 'unavailable' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
