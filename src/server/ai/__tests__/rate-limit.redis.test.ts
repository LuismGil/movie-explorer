// @vitest-environment node
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { beforeEach, describe, expect, it } from 'vitest';
import { createAiRateLimiter } from '../rate-limit';
import { AI_ADMISSION_KEY, AI_ADMISSION_LIMITS } from '../rate-limit.script';
import { createAiSearchHandler } from '../search-handler';

const exec = promisify(execFile);
const container = process.env.AI_RATE_LIMIT_TEST_REDIS_CONTAINER;

// Opt-in real Redis tests. The script starts an isolated local container; never Upstash/Google.
describe.skipIf(!container)('atomic AI admission against real local Redis', () => {
  async function redis(...command: (string | number)[]): Promise<unknown> {
    const { stdout } = await exec('docker', ['exec', container!, 'redis-cli', '--json', ...command.map(String)], { timeout: 5000 });
    return JSON.parse(stdout);
  }

  async function nowMs(): Promise<number> {
    const time = await redis('TIME') as string[];
    return Number(time[0]) * 1000 + Math.floor(Number(time[1]) / 1000);
  }

  const fetch: typeof globalThis.fetch = async (_, init) => {
    const command = JSON.parse(init!.body as string) as (string | number)[];
    return Response.json({ result: await redis(...command) });
  };
  const limiter = () => createAiRateLimiter({
    env: { UPSTASH_REDIS_REST_URL: 'https://local-test.upstash.io', UPSTASH_REDIS_REST_TOKEN: 'synthetic-token-only-used-for-local-tests' },
    fetch,
  });

  beforeEach(async () => { await redis('DEL', AI_ADMISSION_KEY); });

  it('admits only one simultaneous call across independent handler instances', async () => {
    let pipelineCalls = 0;
    const handlers = Array.from({ length: 12 }, () => createAiSearchHandler({
      enabled: true, rateLimit: limiter(),
      run: async () => {
        pipelineCalls += 1;
        return { status: 'unsupported', code: 'unsupported_request', usage: {
          plannerCalls: 1, toolCallsReserved: 0, inputTokens: 10, outputTokens: 10, totalTokens: 20,
        } };
      },
    }));
    const responses = await Promise.all(handlers.map(handler => handler(new Request('http://localhost/api/ai/search', {
      method: 'POST', headers: { Origin: 'http://localhost', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Find a film' }),
    }))));
    expect(responses.filter(response => response.status === 200)).toHaveLength(1);
    expect(responses.filter(response => response.status === 429)).toHaveLength(11);
    expect(pipelineCalls).toBe(1);
    await Promise.all(responses.map(response => response.text()));
    expect(await redis('ZCARD', AI_ADMISSION_KEY)).toBe(1);
    const ttl = await redis('PTTL', AI_ADMISSION_KEY) as number;
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(AI_ADMISSION_LIMITS.windowMs);
  });

  it('blocks a second attempt for sixty seconds without extending the window', async () => {
    expect(await limiter()(new AbortController().signal)).toEqual({ status: 'allowed' });
    expect(await limiter()(new AbortController().signal)).toMatchObject({ status: 'limited', retryAfterSeconds: 60 });
    expect(await redis('ZCARD', AI_ADMISSION_KEY)).toBe(1);
  });

  it('enforces the rolling 24-hour ceiling independently of the minute cooldown', async () => {
    const now = await nowMs();
    for (let index = 0; index < 10; index += 1) {
      const admittedAt = now - 3_600_000 - index * 60_000;
      await redis('ZADD', AI_ADMISSION_KEY, admittedAt, admittedAt);
    }
    const decision = await limiter()(new AbortController().signal);
    expect(decision.status).toBe('limited');
    if (decision.status === 'limited') expect(decision.retryAfterSeconds).toBeGreaterThan(80_000);
    expect(await redis('ZCARD', AI_ADMISSION_KEY)).toBe(10);
  });

  it('removes only expired admissions and permits the tenth, but not the eleventh', async () => {
    const now = await nowMs();
    await redis('ZADD', AI_ADMISSION_KEY, now - 86_400_001, 'expired');
    for (let index = 0; index < 9; index += 1) {
      const admittedAt = now - (index + 2) * 60_000;
      await redis('ZADD', AI_ADMISSION_KEY, admittedAt, admittedAt);
    }
    expect(await limiter()(new AbortController().signal)).toEqual({ status: 'allowed' });
    expect(await redis('ZCARD', AI_ADMISSION_KEY)).toBe(10);
    expect(await redis('ZSCORE', AI_ADMISSION_KEY, 'expired')).toBe(null);
    expect(await limiter()(new AbortController().signal)).toMatchObject({ status: 'limited' });
  });

  it('uses the Redis clock, not caller-controlled deployment clocks', async () => {
    const now = await nowMs();
    await redis('ZADD', AI_ADMISSION_KEY, now - 60_100, 'previous');
    expect(await limiter()(new AbortController().signal)).toEqual({ status: 'allowed' });
    expect(await redis('ZCARD', AI_ADMISSION_KEY)).toBe(2);
  });
});
