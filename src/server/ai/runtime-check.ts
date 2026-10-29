import 'server-only';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import type { runSearchAgent } from '../agents/search-agent';
import { searchAgentResultSchema } from '../agents/search-agent.schemas';
import { awaitWithSignal, createDeadline } from '../runtime/abort';

const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
const secretSchema = z.string().min(32).max(256).regex(/^[\x21-\x7e]+$/);
const configuration = z.object({
  UPSTASH_REDIS_REST_URL: z.string().url().refine(value => {
    if (!URL.canParse(value)) return false;
    const url = new URL(value);
    return url.protocol === 'https:' && /^[a-z0-9-]+\.upstash\.io$/.test(url.hostname)
      && !url.username && !url.password && !url.port && url.pathname === '/' && !url.search && !url.hash;
  }),
  UPSTASH_REDIS_REST_TOKEN: z.string().trim().min(32).max(4096).regex(/^\S+$/),
  MCP_SERVER_URL: z.literal('https://movie-explorer-ppc2.onrender.com/mcp'),
  MCP_INTERNAL_API_KEY: z.string().min(32).max(4096).regex(/^\S+$/),
});
const wireSchema = z.strictObject({ result: z.union([z.literal('PONG'), z.literal(1)]) });
const isolatedScript = `
if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'EX', 5) then
  if redis.call('GET', KEYS[1]) == ARGV[1] then return 1 end
end
return 0
`;
type Probe = { status: 'passed' | 'failed' | 'not_run'; elapsedMs: number };
type Options = {
  env?: Readonly<Record<string, string | undefined>>;
  fetch?: typeof globalThis.fetch;
  search?: typeof runSearchAgent;
};
const failure = (error: string, status: number) => Response.json({ error }, { status, headers });

async function readResult(response: Response, signal: AbortSignal): Promise<unknown> {
  if (!response.body) throw new Error('Invalid response');
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let text = '';
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await awaitWithSignal(() => reader.read(), signal);
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 1024) throw new Error('Invalid response');
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

/** Temporary operator-only dependency check. No request data controls targets or operations. */
export function createRuntimeCheckHandler(options: Options = {}) {
  return async (request: Request): Promise<Response> => {
    const env = options.env ?? process.env;
    const secret = secretSchema.safeParse(env.AI_RUNTIME_CHECK_API_KEY);
    if (!secret.success) return failure('operator_configuration_invalid', 503);
    const match = /^Bearer ([^\s]+)$/i.exec(request.headers.get('authorization') ?? '');
    const expected = Buffer.from(secret.data);
    const received = Buffer.from(match?.[1] ?? '');
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return failure('unauthorized', 401);
    if (request.method !== 'POST') return failure('invalid_request', 405);
    if (new URL(request.url).search) return failure('invalid_request', 400);
    const config = configuration.safeParse(env);
    if (!config.success) {
      // Report only fixed field names, never Zod issues, received values or credentials.
      const variables = configuration.keyof().options.filter(name => config.error.issues.some(issue => issue.path[0] === name));
      return Response.json({ error: 'configuration_invalid', variables }, { status: 503, headers });
    }

    const deadline = createDeadline(30_000, request.signal);
    const started = performance.now();
    const checks: { upstash: Probe; mcp: Probe } = {
      upstash: { status: 'not_run', elapsedMs: 0 }, mcp: { status: 'not_run', elapsedMs: 0 },
    };
    async function probe(name: keyof typeof checks, operation: () => Promise<void>) {
      deadline.check();
      const start = performance.now();
      checks[name].status = 'failed';
      try {
        await awaitWithSignal(operation, deadline.signal);
        deadline.check();
        checks[name].status = 'passed';
      } catch { /* Errors may contain credentials or tool payloads; never log or return them. */ }
      finally { checks[name].elapsedMs = Math.round(performance.now() - start); }
    }
    try {
      if (request.body) {
        const reader = request.body.getReader();
        try {
          if (!(await awaitWithSignal(() => reader.read(), deadline.signal)).done) return failure('invalid_request', 400);
        } finally { void reader.cancel().catch(() => undefined); reader.releaseLock(); }
      }
      await probe('upstash', async () => {
        const storageDeadline = createDeadline(2000, deadline.signal);
        try {
          const commands = [
            ['PING'],
            ['EVAL', isolatedScript, 1, `movie-explorer:diagnostic:runtime:${randomUUID()}`, randomUUID()],
          ];
          for (const [index, command] of commands.entries()) {
            const response = await awaitWithSignal(() => (options.fetch ?? globalThis.fetch)(config.data.UPSTASH_REDIS_REST_URL, {
              method: 'POST', headers: { Authorization: `Bearer ${config.data.UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(command), signal: storageDeadline.signal, redirect: 'error', cache: 'no-store', credentials: 'omit',
            }), storageDeadline.signal);
            if (!response.ok || response.redirected || !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '')) {
              void response.body?.cancel().catch(() => undefined);
              throw new Error('Invalid response');
            }
            const result = wireSchema.parse(await readResult(response, storageDeadline.signal));
            storageDeadline.check();
            if (result.result !== (index === 0 ? 'PONG' : 1)) throw new Error('Invalid response');
          }
        } finally { storageDeadline.dispose(); }
      });
      await probe('mcp', async () => {
        const search = options.search ?? (await import('../agents/search-agent')).runSearchAgent;
        deadline.check();
        const result = searchAgentResultSchema.parse(await search({ calls: [{ tool: 'search_movies', query: 'Inception', page: 1 }] }, {
          signal: deadline.signal, timeoutMs: 10_000, maxToolCalls: 1,
        }));
        if (result.status !== 'complete' || result.outcomes.length !== 1 || result.outcomes[0].status !== 'succeeded'
          || result.outcomes[0].tool !== 'search_movies' || result.movies.length === 0) throw new Error('Invalid search result');
      });
    } catch { /* Cancellation stops later probes without exposing request or configuration. */ }
    finally { deadline.dispose(); }
    const passed = checks.upstash.status === 'passed' && checks.mcp.status === 'passed';
    return Response.json({ status: passed ? 'passed' : 'failed', elapsedMs: Math.round(performance.now() - started), checks }, {
      status: passed ? 200 : 503, headers,
    });
  };
}
