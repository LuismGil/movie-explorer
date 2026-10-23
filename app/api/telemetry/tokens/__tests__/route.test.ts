import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GET } from '../route';
import { recordPlannerTokenUsage, resetAiTelemetryForTests } from '@/server/telemetry/ai-metrics';

const secret = 'test-telemetry-operator-key-with-at-least-32-characters';
const originalSecret = process.env.AI_TELEMETRY_API_KEY;

describe('GET /api/telemetry/tokens', () => {
  beforeEach(() => {
    resetAiTelemetryForTests();
    process.env.AI_TELEMETRY_API_KEY = secret;
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.AI_TELEMETRY_API_KEY;
    else process.env.AI_TELEMETRY_API_KEY = originalSecret;
  });

  it('fails closed when the operator key is not configured', async () => {
    delete process.env.AI_TELEMETRY_API_KEY;
    const response = GET(new Request('https://example.test/api/telemetry/tokens'));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'unavailable' });
  });

  it('requires a constant-time checked bearer key and returns no-store aggregates', async () => {
    const denied = GET(new Request('https://example.test/api/telemetry/tokens'));
    expect(denied.status).toBe(401);

    recordPlannerTokenUsage({ inputTokens: 41, outputTokens: 9, totalTokens: 50 });
    const response = GET(new Request('https://example.test/api/telemetry/tokens', {
      headers: { Authorization: `Bearer ${secret}` },
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.json()).toMatchObject({
      scope: 'process-local',
      agents: { planner: { tokenUsage: { reports: 1, inputTokens: 41, outputTokens: 9, totalTokens: 50 } } },
    });
  });
});
