import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: ['.env.local', '.env'], quiet: true });
const secret = process.env.AI_RUNTIME_CHECK_API_KEY;
const probe = z.strictObject({ status: z.enum(['passed', 'failed', 'not_run']), elapsedMs: z.number().int().nonnegative().max(60_000) });
const resultSchema = z.strictObject({
  status: z.enum(['passed', 'failed']), elapsedMs: z.number().int().nonnegative().max(60_000),
  checks: z.strictObject({ upstash: probe, mcp: probe }),
});

if (!secret || !/^[\x21-\x7e]{32,256}$/.test(secret)) {
  console.error('Runtime check not run: configure AI_RUNTIME_CHECK_API_KEY privately in local env and Vercel Production.');
  process.exitCode = 2;
} else {
  try {
    const response = await fetch('https://movie-explorer-luis.vercel.app/api/internal/runtime-check', {
      method: 'POST', headers: { Authorization: `Bearer ${secret}` }, redirect: 'error', cache: 'no-store',
      signal: AbortSignal.timeout(40_000),
    });
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Invalid response');
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let text = '';
    let bytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 1024) throw new Error('Invalid response');
        text += decoder.decode(value, { stream: true });
      }
    } finally { void reader.cancel().catch(() => undefined); reader.releaseLock(); }
    const result = resultSchema.safeParse(JSON.parse(text + decoder.decode()));
    if (!result.success) {
      console.error(`Runtime check returned HTTP ${response.status}; check operator configuration. No response content logged.`);
      process.exitCode = 1;
    } else {
      console.log(JSON.stringify(result.data));
      if (!response.ok || result.data.status !== 'passed' || result.data.checks.upstash.status !== 'passed'
        || result.data.checks.mcp.status !== 'passed') process.exitCode = 1;
    }
  } catch {
    console.error('Runtime check failed; no credentials, request content or raw response logged. No automatic retry.');
    process.exitCode = 1;
  }
}
