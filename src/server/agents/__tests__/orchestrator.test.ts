// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runOrchestrator } from '../orchestrator';
import { runQualityAgent } from '../quality-agent';
import { runSearchAgent } from '../search-agent';
import { orchestratorResultSchema, PlannerFailure, type OrchestratorDecision, type OrchestratorPlanner } from '../orchestrator.schemas';
import type { SearchAgentResult } from '../search-agent.schemas';

const { getMcpClient } = vi.hoisted(() => ({ getMcpClient: vi.fn() }));
vi.mock('../../mcp/client', () => ({ getMcpClient }));

const movie = { id: 42, title: 'Example Film', overview: 'From MCP', poster_path: '/poster.jpg' };
const evidence: SearchAgentResult = {
  status: 'complete', movies: [movie], details: [], credits: [],
  outcomes: [{ callIndex: 0, tool: 'search_movies', status: 'succeeded', itemCount: 1 }],
};
const reportedUsage = { inputTokens: 100, outputTokens: 40, totalTokens: 140 };
const decision = (overrides: Partial<OrchestratorDecision> = {}): OrchestratorDecision => ({
  intent: 'search', queries: ['Example'], movieId: null, window: null, ...overrides,
});

describe('runOrchestrator', () => {
  let planner: ReturnType<typeof vi.fn<OrchestratorPlanner>>;
  let searchAgent: ReturnType<typeof vi.fn<typeof runSearchAgent>>;
  let qualityAgent: ReturnType<typeof vi.fn<typeof runQualityAgent>>;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Live HTTP forbidden in tests'); }));
    planner = vi.fn<OrchestratorPlanner>().mockResolvedValue({ decision: decision(), usage: reportedUsage });
    searchAgent = vi.fn<typeof runSearchAgent>().mockResolvedValue(structuredClone(evidence));
    qualityAgent = vi.fn(runQualityAgent);
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it('sequences planning → Search → Quality and exposes only an approved DTO', async () => {
    const result = await runOrchestrator({ message: ' Find <b>Example</b>\u202e ' }, { planner, searchAgent, qualityAgent });
    expect(planner.mock.calls[0][0]).toEqual({ message: 'Find Example' });
    expect(searchAgent).toHaveBeenCalledWith({ calls: [{ tool: 'search_movies', query: 'Example' }] }, {
      signal: expect.any(AbortSignal), timeoutMs: 10000, maxToolCalls: 5,
    });
    expect(qualityAgent).toHaveBeenCalledWith(evidence, { movies: [{ movieId: 42 }] });
    expect(planner.mock.invocationCallOrder[0]).toBeLessThan(searchAgent.mock.invocationCallOrder[0]);
    expect(searchAgent.mock.invocationCallOrder[0]).toBeLessThan(qualityAgent.mock.invocationCallOrder[0]);
    expect(result).toMatchObject({
      status: 'completed', intent: 'search', presentation: { status: 'approved', source: 'tmdb', movies: [{ id: 42, title: movie.title }] },
      usage: { plannerCalls: 1, toolCallsReserved: 1, ...reportedUsage },
    });
    expect(orchestratorResultSchema.safeParse(result).success).toBe(true);
    expect(result).not.toHaveProperty('decision');
    expect(result).not.toHaveProperty('outcomes');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it.each([
    null, {}, { message: '' }, { message: ' ' }, { message: '<script>erase()</script>' }, { message: 'x'.repeat(1001) },
    { message: 'find', referenceMovieId: 0 }, { message: 'find', referenceMovieId: 1.5 },
    { message: 'find', referenceMovieId: '42' }, { message: 'GOOGLE_GENERATIVE_AI_API_KEY' },
    { message: 'authorization:\u202ebearer synthetic-secret' },
    { message: 'authorization: Bearer secret' }, { message: 'find', freeTierConfirmed: true },
    { message: 'find', evidence }, { message: 'find', model: 'other' },
  ])('rejects invalid/untrusted request fields before planning: %j', async input => {
    const result = await runOrchestrator(input, { planner, searchAgent, qualityAgent });
    expect(result).toMatchObject({ status: 'failed', code: 'invalid_request', usage: { plannerCalls: 0 } });
    expect(planner).not.toHaveBeenCalled();
    expect(searchAgent).not.toHaveBeenCalled();
    expect(qualityAgent).not.toHaveBeenCalled();
  });

  it.each([{ timeoutMs: 30001 }, { maxToolCalls: 6 }, { maxInputTokens: 4097 }, { maxOutputTokens: 513 }, { maxTotalTokens: 4609 }, { retries: 1 }])(
    'does not allow raising hard ceilings or enabling retries: %j', async limits => {
      expect(await runOrchestrator({ message: 'find' }, { planner, limits })).toMatchObject({ status: 'failed', code: 'invalid_configuration' });
      expect(planner).not.toHaveBeenCalled();
    },
  );

  it.each([
    [decision({ queries: ['Example', 'Other', 'Example'] }), undefined, [{ tool: 'search_movies', query: 'Example' }, { tool: 'search_movies', query: 'Other' }]],
    [decision({ intent: 'trending', queries: [], window: 'day' }), undefined, [{ tool: 'get_trending', window: 'day' }]],
    [decision({ intent: 'trending', queries: [], window: 'week' }), undefined, [{ tool: 'get_trending', window: 'week' }]],
    [decision({ intent: 'details', queries: [], movieId: 42 }), 42, [{ tool: 'get_movie_details', movieId: '42' }, { tool: 'get_credits', movieId: '42' }]],
    [decision({ intent: 'credits', queries: [], movieId: 42 }), 42, [{ tool: 'get_movie_details', movieId: '42' }, { tool: 'get_credits', movieId: '42' }]],
    [decision({ intent: 'recommendations', queries: [], movieId: 42 }), 42, [{ tool: 'get_recommendations', movieId: '42' }]],
  ])('compiles allowlisted tools for %j', async (plan, referenceMovieId, calls) => {
    planner.mockResolvedValue({ decision: plan, usage: reportedUsage });
    await runOrchestrator({ message: 'movie request', referenceMovieId }, { planner, searchAgent });
    expect(searchAgent.mock.calls[0][0]).toEqual({ calls });
  });

  it('requires selection of a searched movie instead of silently guessing an ID', async () => {
    planner.mockResolvedValue({ decision: decision({ intent: 'clarify_movie' }), usage: reportedUsage });
    const result = await runOrchestrator({ message: 'Who directed Example?' }, { planner, searchAgent });
    expect(result).toMatchObject({ status: 'needs_selection', intent: 'clarify_movie', presentation: { movies: [{ id: 42 }] } });
    expect(searchAgent.mock.calls[0][0]).toEqual({ calls: [{ tool: 'search_movies', query: 'Example' }] });
  });

  it.each([
    { ...decision(), prompt: 'private' }, decision({ intent: 'details', queries: [], movieId: 99 }),
    decision({ intent: 'details', queries: [], movieId: 42 }), decision({ intent: 'search', queries: [] }),
    decision({ queries: ['<script>attack</script>'] }), decision({ queries: ['api_key=secret'] }),
    decision({ queries: ['x'.repeat(101)] }), decision({ queries: ['a', 'b', 'c', 'd'] }),
    decision({ intent: 'trending', queries: [], window: null }), decision({ intent: 'clarify_movie', queries: ['a', 'b'] }),
    { ...decision(), intent: 'fetch_url', url: 'https://invalid.test' },
  ])('rejects malformed/unsafe or invented-ID plans: %j', async plan => {
    planner.mockResolvedValue({ decision: plan, usage: reportedUsage });
    expect(await runOrchestrator({ message: 'movie request' }, { planner, searchAgent, qualityAgent })).toMatchObject({ status: 'failed', code: 'invalid_plan' });
    expect(searchAgent).not.toHaveBeenCalled();
    expect(qualityAgent).not.toHaveBeenCalled();
  });

  it('also rejects a model ID that differs from supplied context', async () => {
    planner.mockResolvedValue({ decision: decision({ intent: 'details', queries: [], movieId: 99 }), usage: reportedUsage });
    expect(await runOrchestrator({ message: 'details', referenceMovieId: 42 }, { planner, searchAgent })).toMatchObject({ code: 'invalid_plan' });
    expect(searchAgent).not.toHaveBeenCalled();
  });

  it('reserves the complete plan budget before opening MCP, without truncation or retries', async () => {
    planner.mockResolvedValue({ decision: decision({ intent: 'details', queries: [], movieId: 42 }), usage: reportedUsage });
    expect(await runOrchestrator({ message: 'details', referenceMovieId: 42 }, { planner, searchAgent, limits: { maxToolCalls: 1 } })).toMatchObject({
      status: 'failed', code: 'tool_budget_exceeded', usage: { plannerCalls: 1, toolCallsReserved: 0 },
    });
    expect(planner).toHaveBeenCalledTimes(1);
    expect(searchAgent).not.toHaveBeenCalled();
  });

  it.each([
    { inputTokens: 4097, outputTokens: 1, totalTokens: 4098 },
    { inputTokens: 1, outputTokens: 513, totalTokens: 514 },
    { inputTokens: 4096, outputTokens: 512, totalTokens: 4609 },
  ])('rejects over-budget reported usage before tools: %j', async usage => {
    planner.mockResolvedValue({ decision: decision(), usage });
    expect(await runOrchestrator({ message: 'find' }, { planner, searchAgent })).toMatchObject({ code: 'token_budget_exceeded' });
    expect(searchAgent).not.toHaveBeenCalled();
  });

  it.each([undefined, {}, { inputTokens: -1, outputTokens: 1, totalTokens: 1 }, { inputTokens: 100, outputTokens: 10, totalTokens: 1 }])(
    'fails closed without reliable usage: %j', async usage => {
      planner.mockResolvedValue({ decision: decision(), usage });
      expect(await runOrchestrator({ message: 'find' }, { planner, searchAgent })).toMatchObject({ code: 'invalid_provider_usage' });
      expect(searchAgent).not.toHaveBeenCalled();
    },
  );

  it('returns controlled unsupported status with no tools or presentation', async () => {
    planner.mockResolvedValue({ decision: decision({ intent: 'unsupported', queries: [] }), usage: reportedUsage });
    expect(await runOrchestrator({ message: 'unrelated' }, { planner, searchAgent, qualityAgent })).toEqual({
      status: 'unsupported', code: 'unsupported_request', usage: { plannerCalls: 1, toolCallsReserved: 0, ...reportedUsage },
    });
    expect(searchAgent).not.toHaveBeenCalled();
    expect(qualityAgent).not.toHaveBeenCalled();
  });

  it('keeps valid partial evidence through the real Quality gate', async () => {
    searchAgent.mockResolvedValue({ ...evidence, status: 'partial', outcomes: [
      ...evidence.outcomes, { callIndex: 1, tool: 'get_trending', status: 'failed', reason: 'request_failed' },
    ] });
    expect(await runOrchestrator({ message: 'find' }, { planner, searchAgent })).toMatchObject({
      status: 'completed', presentation: { status: 'partial', movies: [{ id: 42 }], issues: [{ code: 'partial_search' }] },
    });
  });

  it.each(['search', 'clarify_movie'] as const)('returns an approved empty result for %s with no matches', async intent => {
    planner.mockResolvedValue({ decision: decision({ intent }), usage: reportedUsage });
    searchAgent.mockResolvedValue({ ...evidence, movies: [], outcomes: [{ callIndex: 0, tool: 'search_movies', status: 'succeeded', itemCount: 0 }] });
    expect(await runOrchestrator({ message: 'find' }, { planner, searchAgent })).toMatchObject({ status: 'completed', presentation: { status: 'empty', movies: [] } });
  });

  it('fails closed when all Search calls fail', async () => {
    searchAgent.mockResolvedValue({ ...evidence, status: 'failed', movies: [], outcomes: [{ callIndex: 0, tool: 'search_movies', status: 'failed', reason: 'mcp_unavailable' }] });
    const result = await runOrchestrator({ message: 'find' }, { planner, searchAgent });
    expect(result).toMatchObject({ status: 'failed', code: 'search_unavailable' });
    expect(result).not.toHaveProperty('presentation');
  });

  it('rejects inconsistent or unsafe Search evidence rather than exposing it', async () => {
    searchAgent.mockResolvedValue({ ...evidence, movies: [{ ...movie, title: 'GOOGLE_GENERATIVE_AI_API_KEY' }] });
    expect(await runOrchestrator({ message: 'find' }, { planner, searchAgent })).toMatchObject({ status: 'failed', code: 'quality_rejected' });
  });

  it('rejects an invalid gate DTO', async () => {
    qualityAgent.mockReturnValue({ ...runQualityAgent(evidence, { movies: [{ movieId: 42 }] }), raw: 'private' } as ReturnType<typeof runQualityAgent>);
    expect(await runOrchestrator({ message: 'find' }, { planner, searchAgent, qualityAgent })).toMatchObject({ status: 'failed', code: 'quality_rejected' });
  });

  it('limits presentation selections to 20 server-derived IDs and does not mutate evidence', async () => {
    const expanded = { ...evidence, movies: Array.from({ length: 40 }, (_, i) => ({ ...movie, id: i + 1 })), outcomes: [
      { callIndex: 0, tool: 'search_movies' as const, status: 'succeeded' as const, itemCount: 20 },
      { callIndex: 1, tool: 'search_movies' as const, status: 'succeeded' as const, itemCount: 20 },
    ] };
    const before = structuredClone(expanded);
    searchAgent.mockResolvedValue(expanded);
    const result = await runOrchestrator({ message: 'find' }, { planner, searchAgent, qualityAgent });
    expect(result.status === 'completed' && result.presentation.movies.length).toBe(20);
    expect(expanded).toEqual(before);
  });

  it('does not activate the real provider without the server/operator approval flag', async () => {
    expect(await runOrchestrator({ message: 'find' })).toMatchObject({ status: 'failed', code: 'provider_disabled' });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it.each(['provider_quota', 'provider_auth', 'provider_unavailable'] as const)('does not retry or fall back on %s', async code => {
    planner.mockRejectedValue(new PlannerFailure(code));
    const result = await runOrchestrator({ message: 'find' }, { planner, searchAgent });
    expect(result).toMatchObject({ status: 'failed', code });
    expect(planner).toHaveBeenCalledTimes(1);
    expect(searchAgent).not.toHaveBeenCalled();
  });

  it('does not leak raw errors from dependencies', async () => {
    searchAgent.mockRejectedValue(new Error('Bearer private-credential raw model text'));
    const result = await runOrchestrator({ message: 'find' }, { planner, searchAgent });
    expect(result).toMatchObject({ status: 'failed', code: 'internal_error' });
    expect(JSON.stringify(result)).not.toMatch(/private-credential|raw model/);
  });

  it('does no work when already cancelled', async () => {
    expect(await runOrchestrator({ message: 'find' }, { planner, signal: AbortSignal.abort() })).toMatchObject({ code: 'cancelled', usage: { plannerCalls: 0 } });
    expect(planner).not.toHaveBeenCalled();
  });

  it('enforces the global deadline even if planning ignores cancellation', async () => {
    vi.useFakeTimers();
    planner.mockImplementation(() => new Promise(() => {}));
    const result = runOrchestrator({ message: 'find' }, { planner, searchAgent, limits: { timeoutMs: 50 } });
    await vi.advanceTimersByTimeAsync(50);
    expect(await result).toMatchObject({ code: 'deadline_exceeded', usage: { toolCallsReserved: 0 } });
    expect(planner.mock.calls[0][1].signal.aborted).toBe(true);
    expect(searchAgent).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancels Search and never runs Quality on late evidence', async () => {
    const controller = new AbortController();
    let resolveSearch!: (value: SearchAgentResult) => void;
    searchAgent.mockImplementation(() => new Promise(resolve => { resolveSearch = resolve; }));
    const result = runOrchestrator({ message: 'find' }, { planner, searchAgent, qualityAgent, signal: controller.signal });
    await vi.waitFor(() => expect(searchAgent).toHaveBeenCalledTimes(1));
    controller.abort('private cancellation reason');
    expect(await result).toMatchObject({ code: 'cancelled' });
    resolveSearch(evidence);
    await Promise.resolve();
    expect(qualityAgent).not.toHaveBeenCalled();
  });

  it('detects a synchronous gate crossing the deadline and cleans up timers', async () => {
    vi.useFakeTimers();
    qualityAgent.mockImplementation((context, proposal) => {
      vi.setSystemTime(Date.now() + 51);
      return runQualityAgent(context, proposal);
    });
    expect(await runOrchestrator({ message: 'find' }, { planner, searchAgent, qualityAgent, limits: { timeoutMs: 50 } })).toMatchObject({ code: 'deadline_exceeded' });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('integrates the real Search executor and Quality gate against only a mocked MCP client', async () => {
    const callTool = vi.fn().mockResolvedValue({ content: [{ type: 'text', text: JSON.stringify({ results: [movie], total_pages: 1 }) }] });
    getMcpClient.mockResolvedValue({ callTool });
    const result = await runOrchestrator({ message: 'find Example' }, { planner });
    expect(result).toMatchObject({ status: 'completed', presentation: { movies: [{ id: 42 }] } });
    expect(callTool).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
