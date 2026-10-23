import { beforeEach, describe, expect, it } from 'vitest';
import {
  getAiTelemetrySnapshot,
  measureAgent,
  recordPlannerTokenUsage,
  recordToolCall,
  resetAiTelemetryForTests,
} from '../ai-metrics';

describe('AI telemetry', () => {
  beforeEach(() => resetAiTelemetryForTests());

  it('aggregates ten runs without retaining request or result content', async () => {
    for (let index = 0; index < 10; index += 1) {
      await measureAgent('planner', async () => ({ ok: true }));
      recordPlannerTokenUsage({ inputTokens: 100 + index, outputTokens: 20, totalTokens: 120 + index });
      recordToolCall('search_movies', 12 + index, false);
    }

    const snapshot = getAiTelemetrySnapshot();
    expect(snapshot.agents.planner).toMatchObject({
      calls: 10,
      failures: 0,
      tokenUsage: { reports: 10, inputTokens: 1045, outputTokens: 200, totalTokens: 1245 },
    });
    expect(snapshot.agents.search.tokenUsage).toEqual({ reports: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 });
    expect(snapshot.tools.search_movies).toMatchObject({ calls: 10, failures: 0, totalLatencyMs: 165, maxLatencyMs: 21 });
    expect(JSON.stringify(snapshot)).not.toMatch(/prompt|message|movieId|Inception|secret/i);
  });

  it('counts failed stages and failed tool calls using fixed-cardinality dimensions', async () => {
    await expect(measureAgent('search', async () => { throw new Error('private request data'); })).rejects.toThrow('private request data');
    recordToolCall('get_movie_details', 25, true);

    const snapshot = getAiTelemetrySnapshot();
    expect(snapshot.agents.search).toMatchObject({ calls: 1, failures: 1 });
    expect(snapshot.tools.get_movie_details).toMatchObject({ calls: 1, failures: 1, totalLatencyMs: 25 });
    expect(JSON.stringify(snapshot)).not.toContain('private request data');
  });
});
