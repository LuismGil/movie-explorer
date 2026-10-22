// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { readAiStream } from '../read-stream';
import { AI_STREAM_MAX_BYTES, aiStreamEventSchema } from '../stream-contract';
import { approvedPresentation, ndjson, progressEvents, resultEvent } from './fixtures';

const response = (body: string, status = 200) => new Response(body, { status, headers: { 'Content-Type': 'application/x-ndjson' } });
const signal = () => new AbortController().signal;

describe('validated NDJSON reader', () => {
  it('accepts UTF-8 characters split across arbitrary byte boundaries', async () => {
    const bytes = new TextEncoder().encode(ndjson([...progressEvents, resultEvent]));
    const body = new ReadableStream({ start(controller) { for (const byte of bytes) controller.enqueue(Uint8Array.of(byte)); controller.close(); } });
    const progress = vi.fn();
    const result = await readAiStream(new Response(body, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' } }), progress, signal());
    expect(result).toEqual(resultEvent);
    expect(progress.mock.calls).toEqual([['planning'], ['searching'], ['validating']]);
  });

  it('does not publish a result until the stream ends', async () => {
    let close!: () => void;
    const body = new ReadableStream({ start(controller) {
      controller.enqueue(new TextEncoder().encode(ndjson([...progressEvents, resultEvent])));
      close = () => controller.close();
    } });
    let finished = false;
    const result = readAiStream(new Response(body, { headers: { 'Content-Type': 'application/x-ndjson' } }), () => {}, signal()).then(value => { finished = true; return value; });
    await Promise.resolve(); await Promise.resolve();
    expect(finished).toBe(false);
    close();
    expect(await result).toEqual(resultEvent);
  });

  it.each([
    [{ type: 'error', code: 'disabled' }],
    [progressEvents[0], { type: 'error', code: 'quota_exceeded' }],
    [progressEvents[0], { type: 'unsupported' }],
  ])('accepts only controlled error/unsupported terminals: %j', async (...events) => {
    expect(await readAiStream(response(ndjson(events), 503), () => {}, signal())).toEqual(events.at(-1));
  });

  it.each([
    '', '{"type":"error"}\n', '{"type":"error","code":"disabled"}',
    ndjson([resultEvent]), ndjson([progressEvents[1], resultEvent]),
    ndjson([progressEvents[0], progressEvents[0], { type: 'unsupported' }]),
    ndjson([...progressEvents, resultEvent, { type: 'error', code: 'disabled' }]),
    ndjson([...progressEvents, { ...resultEvent, raw: 'private' }]),
    ndjson([{ type: 'progress', stage: 'planning', prompt: 'private' }]),
    ndjson([{ type: 'error', code: 'unavailable', message: 'private' }]),
    ndjson([...progressEvents, { ...resultEvent, presentation: { ...approvedPresentation, status: 'rejected' } }]),
    ndjson([...progressEvents, { ...resultEvent, presentation: { ...approvedPresentation, movies: [{ ...approvedPresentation.movies[0], title: '<script>attack</script>' }] } }]),
    `${ndjson([...progressEvents, resultEvent])}\n`,
  ])('rejects malformed/truncated/out-of-order/unsafe streams without returning presentation: %s', async body => {
    await expect(readAiStream(response(body), () => {}, signal())).rejects.toThrow();
  });

  it('rejects result frames on HTTP errors', async () => {
    await expect(readAiStream(response(ndjson([...progressEvents, resultEvent]), 500), () => {}, signal())).rejects.toThrow();
  });

  it('rejects raw text or unexpected media types', async () => {
    await expect(readAiStream(new Response('raw model output'), () => {}, signal())).rejects.toThrow();
  });

  it('caps the total response bytes', async () => {
    await expect(readAiStream(response('x'.repeat(AI_STREAM_MAX_BYTES + 1)), () => {}, signal())).rejects.toThrow('Stream too large');
  });

  it('rejects invalid UTF-8 instead of replacing malformed characters', async () => {
    await expect(readAiStream(new Response(Uint8Array.of(0xff), { headers: { 'Content-Type': 'application/x-ndjson' } }), () => {}, signal())).rejects.toThrow();
  });

  it('cancels a pending reader and releases it on abort', async () => {
    const controller = new AbortController();
    const cancelled = vi.fn();
    const body = new ReadableStream({ cancel: cancelled });
    const result = readAiStream(new Response(body, { headers: { 'Content-Type': 'application/x-ndjson' } }), () => {}, controller.signal);
    const rejected = expect(result).rejects.toThrow('Cancelled');
    controller.abort();
    await rejected;
    expect(cancelled).toHaveBeenCalledTimes(1);
    expect(body.locked).toBe(false);
  });

  it('rejects selection terminals without choices and unknown nested movie fields', () => {
    expect(aiStreamEventSchema.safeParse({ type: 'result', status: 'needs_selection', presentation: { ...approvedPresentation, status: 'empty', movies: [] } }).success).toBe(false);
    expect(aiStreamEventSchema.safeParse({ ...resultEvent, presentation: { ...approvedPresentation, movies: [{ ...approvedPresentation.movies[0], explanation: 'model prose' }] } }).success).toBe(false);
  });
});
