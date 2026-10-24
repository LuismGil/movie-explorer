import 'server-only';
import { AI_STREAM_MAX_BYTES, aiStreamEventSchema, type AiErrorCode, type AiStreamEvent } from '@/lib/ai/stream-contract';
import { runOrchestrator } from '../agents/orchestrator';
import { orchestratorRequestSchema, orchestratorResultSchema, type OrchestratorFailure } from '../agents/orchestrator.schemas';
import { awaitWithSignal, createDeadline } from '../runtime/abort';
import { aiAdmissionSchema, enforceAiRateLimit, type AiRateLimiter } from './rate-limit';

const headers = {
  'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store, no-transform',
  'X-Content-Type-Options': 'nosniff', 'X-Accel-Buffering': 'no',
};
const encoder = new TextEncoder();
const encode = (event: AiStreamEvent) => encoder.encode(`${JSON.stringify(aiStreamEventSchema.parse(event))}\n`);
function failure(code: AiErrorCode, status: number, retryAfterSeconds?: number) {
  return new Response(encode({ type: 'error', code }), {
    status, headers: { ...headers, ...(retryAfterSeconds === undefined ? {} : { 'Retry-After': String(retryAfterSeconds) }) },
  });
}
function sameOrigin(request: Request): boolean {
  try {
    // Standalone Next may normalize Request.url to localhost. Match the browser's
    // actual Host header, not arbitrary X-Forwarded-Host/Origin overrides.
    const url = new URL(request.url);
    const expected = new URL(`${url.protocol}//${request.headers.get('host') ?? url.host}`);
    return !expected.username && !expected.password && expected.pathname === '/'
      && request.headers.get('origin') === expected.origin;
  } catch { return false; }
}
function publicFailure(code: OrchestratorFailure): AiErrorCode {
  switch (code) {
    case 'provider_disabled': return 'disabled';
    case 'invalid_request': return 'invalid_request';
    case 'provider_quota': return 'quota_exceeded';
    case 'deadline_exceeded': return 'timeout';
    case 'cancelled': return 'cancelled';
    case 'invalid_plan': case 'quality_rejected': return 'unsafe_result';
    default: return 'unavailable';
  }
}
async function readRequest(request: Request, signal: AbortSignal): Promise<unknown> {
  if (!request.body) throw new Error('Invalid request');
  const reader = request.body.getReader();
  let bytes = 0;
  let text = '';
  const decoder = new TextDecoder('utf-8', { fatal: true });
  try {
    while (true) {
      const { done, value } = await awaitWithSignal(() => reader.read(), signal);
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 8192) throw new Error('Body too large');
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

/** Dependencies/activation are trusted server configuration, not request parameters. */
export function createAiSearchHandler(options: { enabled: boolean; run?: typeof runOrchestrator; rateLimit?: AiRateLimiter }) {
  return async (request: Request): Promise<Response> => {
    if (!sameOrigin(request)
      || request.headers.get('sec-fetch-site') === 'cross-site') return failure('invalid_request', 403);
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') ?? '')) return failure('invalid_request', 415);
    const length = request.headers.get('content-length');
    if (length !== null && (!/^\d+$/.test(length) || Number(length) > 8192)) return failure('invalid_request', 413);
    const deadline = createDeadline(35000, request.signal);
    let input;
    try {
      input = orchestratorRequestSchema.safeParse(await readRequest(request, deadline.signal));
    } catch {
      deadline.dispose();
      return failure(deadline.signal.aborted ? deadline.failureCode() === 'cancelled' ? 'cancelled' : 'timeout' : 'invalid_request', 400);
    }
    if (!input.success) { deadline.dispose(); return failure('invalid_request', 400); }
    if (!options.enabled) { deadline.dispose(); return failure('disabled', 503); }

    const admissionDeadline = createDeadline(2000, deadline.signal);
    try {
      const admission = aiAdmissionSchema.parse(await awaitWithSignal(
        () => (options.rateLimit ?? enforceAiRateLimit)(admissionDeadline.signal), admissionDeadline.signal,
      ));
      admissionDeadline.check();
      if (admission.status !== 'allowed') {
        deadline.dispose();
        return admission.status === 'limited'
          ? failure('rate_limited', 429, admission.retryAfterSeconds)
          : failure('unavailable', 503);
      }
    } catch {
      deadline.dispose();
      return failure(deadline.signal.aborted ? deadline.failureCode() === 'cancelled' ? 'cancelled' : 'timeout' : 'unavailable', 503);
    } finally {
      admissionDeadline.dispose();
    }

    let closed = false;
    const cancellation = new AbortController();
    const signal = AbortSignal.any([deadline.signal, cancellation.signal]);
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let bytes = 0;
        function send(event: AiStreamEvent) {
          if (closed || signal.aborted) return;
          const data = encode(event);
          bytes += data.byteLength;
          if (bytes > AI_STREAM_MAX_BYTES) throw new Error('Stream too large');
          controller.enqueue(data);
        }
        try {
          const result = orchestratorResultSchema.parse(await awaitWithSignal(() => (options.run ?? runOrchestrator)(input.data, {
            signal, onProgress: stage => send({ type: 'progress', stage }),
          }), signal));
          if (result.status === 'completed' || result.status === 'needs_selection') {
            send({ type: 'result', status: result.status, presentation: result.presentation });
          } else if (result.status === 'unsupported') send({ type: 'unsupported' });
          else send({ type: 'error', code: publicFailure(result.code) });
        } catch {
          if (!closed) {
            const code = deadline.signal.aborted ? deadline.failureCode() === 'cancelled' ? 'cancelled' : 'timeout' : 'unavailable';
            controller.enqueue(encode({ type: 'error', code }));
          }
        } finally {
          if (!closed) { closed = true; controller.close(); }
          deadline.dispose();
        }
      },
      cancel() { closed = true; cancellation.abort(); deadline.dispose(); },
    });
    return new Response(stream, { headers });
  };
}
