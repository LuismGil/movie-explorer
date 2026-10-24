import 'server-only';
import { z } from 'zod';
import { awaitWithSignal, createDeadline } from '../runtime/abort';
import { AI_ADMISSION_KEY, AI_ADMISSION_LIMITS, AI_ADMISSION_SCRIPT } from './rate-limit.script';

export const aiAdmissionSchema = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('allowed') }),
  z.strictObject({ status: z.literal('limited'), retryAfterSeconds: z.number().int().min(1).max(86_400) }),
  z.strictObject({ status: z.literal('unavailable') }),
]);
export type AiAdmission = z.infer<typeof aiAdmissionSchema>;
export type AiRateLimiter = (signal: AbortSignal) => Promise<AiAdmission>;

const configuration = z.object({
  UPSTASH_REDIS_REST_URL: z.string().url().refine(value => {
    if (!URL.canParse(value)) return false;
    const url = new URL(value);
    return url.protocol === 'https:' && /^[a-z0-9-]+\.upstash\.io$/.test(url.hostname)
      && !url.username && !url.password && !url.port && url.pathname === '/' && !url.search && !url.hash;
  }),
  UPSTASH_REDIS_REST_TOKEN: z.string().trim().min(32).max(4096).regex(/^\S+$/),
});
const wireResult = z.strictObject({
  result: z.tuple([z.union([z.literal(0), z.literal(1)]), z.number().int().min(0).max(86_400)])
    .refine(([allowed, retry]) => allowed === 1 ? retry === 0 : retry > 0),
});

async function readResult(response: Response, signal: AbortSignal): Promise<unknown> {
  if (!response.body) throw new Error('Invalid limiter response');
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await awaitWithSignal(() => reader.read(), signal);
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 1024) throw new Error('Invalid limiter response');
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

/** Inert until called. Options are trusted test/server dependencies, never browser fields. */
export function createAiRateLimiter(options: { env?: Readonly<Record<string, string | undefined>>; fetch?: typeof globalThis.fetch } = {}): AiRateLimiter {
  return async signal => {
    const env = configuration.safeParse(options.env ?? process.env);
    if (!env.success || signal.aborted) return { status: 'unavailable' };
    const deadline = createDeadline(2000, signal);
    try {
      const response = await awaitWithSignal(() => (options.fetch ?? globalThis.fetch)(env.data.UPSTASH_REDIS_REST_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.data.UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(['EVAL', AI_ADMISSION_SCRIPT, 1, AI_ADMISSION_KEY,
          AI_ADMISSION_LIMITS.intervalMs, AI_ADMISSION_LIMITS.windowMs, AI_ADMISSION_LIMITS.maximum]),
        signal: deadline.signal, cache: 'no-store', redirect: 'error', credentials: 'omit',
      }), deadline.signal);
      if (!response.ok || response.redirected || !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '')) {
        void response.body?.cancel().catch(() => undefined);
        return { status: 'unavailable' };
      }
      const parsed = wireResult.safeParse(await readResult(response, deadline.signal));
      deadline.check();
      if (!parsed.success) return { status: 'unavailable' };
      return parsed.data.result[0] === 1
        ? { status: 'allowed' }
        : { status: 'limited', retryAfterSeconds: parsed.data.result[1] };
    } catch {
      // Upstash errors may contain credentials/configuration. Never log or expose them.
      // A lost response can still consume an admission; never retry or refund it.
      return { status: 'unavailable' };
    } finally {
      deadline.dispose();
    }
  };
}

export const enforceAiRateLimit = createAiRateLimiter();
