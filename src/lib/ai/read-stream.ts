import { AI_STREAM_MAX_BYTES, aiStages, aiStreamEventSchema, type AiStage, type AiTerminalEvent } from './stream-contract';

/** Fail closed: no final presentation is returned until the complete stream validates. */
export async function readAiStream(response: Response, onProgress: (stage: AiStage) => void, signal: AbortSignal): Promise<AiTerminalEvent> {
  if (!response.headers.get('content-type')?.startsWith('application/x-ndjson') || !response.body) throw new Error('Invalid stream');
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0;
  let buffer = '';
  let stageIndex = 0;
  let terminal: AiTerminalEvent | undefined;
  const onAbort = () => { void reader.cancel().catch(() => undefined); };
  signal.addEventListener('abort', onAbort, { once: true });
  function accept(line: string) {
    if (terminal || !line) throw new Error('Invalid stream');
    const event = aiStreamEventSchema.parse(JSON.parse(line));
    if (event.type === 'progress') {
      if (event.stage !== aiStages[stageIndex++]) throw new Error('Invalid progress');
      onProgress(event.stage);
    } else {
      if (event.type === 'result' && (stageIndex !== 3 || !response.ok)) throw new Error('Invalid result');
      terminal = event;
    }
  }
  try {
    while (true) {
      if (signal.aborted) throw new Error('Cancelled');
      const { done, value } = await reader.read();
      if (signal.aborted) throw new Error('Cancelled');
      if (done) break;
      bytes += value.byteLength;
      if (bytes > AI_STREAM_MAX_BYTES) throw new Error('Stream too large');
      buffer += decoder.decode(value, { stream: true });
      let index: number;
      while ((index = buffer.indexOf('\n')) !== -1) {
        accept(buffer.slice(0, index));
        buffer = buffer.slice(index + 1);
      }
    }
    buffer += decoder.decode();
    if (buffer.length > 0 || !terminal) throw new Error('Truncated stream');
    return terminal;
  } finally {
    signal.removeEventListener('abort', onAbort);
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
