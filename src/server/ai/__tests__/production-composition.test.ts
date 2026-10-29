// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ enabled: false, run: vi.fn(), admission: vi.fn() }));
vi.mock('../availability', () => ({ get aiDiscoveryEnabled() { return mocks.enabled; } }));
vi.mock('../../agents/orchestrator', () => ({ runOrchestrator: mocks.run }));
vi.mock('../rate-limit', async importOriginal => ({
  ...await importOriginal<typeof import('../rate-limit')>(), enforceAiRateLimit: mocks.admission,
}));

async function invoke(enabled: boolean, extra: Record<string, unknown> = {}) {
  mocks.enabled = enabled;
  vi.resetModules();
  const { POST } = await import('../../../../app/api/ai/search/route');
  return POST(new Request('https://demo.test/api/ai/search', {
    method: 'POST', headers: { Origin: 'https://demo.test', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Busque Matrix', ...extra }),
  }));
}

afterEach(() => { mocks.enabled = false; vi.clearAllMocks(); });

describe('production AI composition (mocked activation only)', () => {
  it('keeps production disabled without admission or orchestration', async () => {
    const response = await invoke(false);
    expect(response.status).toBe(503);
    expect(await response.text()).toBe('{"type":"error","code":"disabled"}\n');
    expect(mocks.admission).not.toHaveBeenCalled();
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it('supplies trusted Google approval only after admission when server activation is enabled', async () => {
    mocks.admission.mockResolvedValue({ status: 'allowed' });
    mocks.run.mockResolvedValue({
      status: 'unsupported', code: 'unsupported_request',
      usage: { plannerCalls: 1, toolCallsReserved: 0, inputTokens: 100, outputTokens: 10, totalTokens: 110 },
    });
    const response = await invoke(true);
    expect(await response.text()).toBe('{"type":"unsupported"}\n');
    expect(mocks.run).toHaveBeenCalledExactlyOnceWith({ message: 'Busque Matrix' }, {
      signal: expect.any(AbortSignal), onProgress: expect.any(Function), google: { freeTierConfirmed: true },
    });
    expect(mocks.admission.mock.invocationCallOrder[0]).toBeLessThan(mocks.run.mock.invocationCallOrder[0]);
  });

  it('does not invoke the approved provider when admission is denied', async () => {
    mocks.admission.mockResolvedValue({ status: 'limited', retryAfterSeconds: 60 });
    const response = await invoke(true);
    expect(response.status).toBe(429);
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it('rejects browser-supplied provider approval before admission', async () => {
    const response = await invoke(true, { google: { freeTierConfirmed: true } });
    expect(response.status).toBe(400);
    expect(mocks.admission).not.toHaveBeenCalled();
    expect(mocks.run).not.toHaveBeenCalled();
  });
});
