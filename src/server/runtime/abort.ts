import 'server-only';

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new Error('Operation aborted');
}

/** Stops waiting on cancellation, including when an injected dependency ignores it. */
export async function awaitWithSignal<T>(operation: () => Promise<T> | T, signal?: AbortSignal): Promise<T> {
  throwIfAborted(signal);
  if (!signal) return operation();
  let onAbort = () => {};
  const aborted = new Promise<never>((_, reject) => {
    onAbort = () => reject(new Error('Operation aborted'));
    signal.addEventListener('abort', onAbort, { once: true });
  });
  try {
    return await Promise.race([
      Promise.resolve().then(() => { throwIfAborted(signal); return operation(); }),
      aborted,
    ]);
  } finally {
    signal.removeEventListener('abort', onAbort);
  }
}

export function createDeadline(timeoutMs: number, externalSignal?: AbortSignal) {
  const controller = new AbortController();
  const expiresAt = Date.now() + timeoutMs;
  let timedOut = false;
  const cancel = () => controller.abort();
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  externalSignal?.addEventListener('abort', cancel, { once: true });
  if (externalSignal?.aborted) cancel();
  return {
    signal: controller.signal,
    check() {
      if (Date.now() >= expiresAt) { timedOut = true; controller.abort(); }
      throwIfAborted(controller.signal);
    },
    failureCode: () => timedOut ? 'deadline_exceeded' as const : 'cancelled' as const,
    dispose() { clearTimeout(timer); externalSignal?.removeEventListener('abort', cancel); },
  };
}
