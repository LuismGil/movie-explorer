import 'server-only';
import type { AiStage } from '@/lib/ai/stream-contract';
import { createDeadline, awaitWithSignal } from '../runtime/abort';
import { createGooglePlanner, type GooglePlannerOptions } from './google-planner';
import { compileOrchestratorPlan } from './orchestrator.plan';
import {
  orchestratorDecisionSchema, orchestratorLimitsSchema, orchestratorRequestSchema, orchestratorResultSchema,
  PlannerFailure, plannerUsageSchema,
  type OrchestratorFailure, type OrchestratorPlanner, type OrchestratorResult, type OrchestratorUsage,
} from './orchestrator.schemas';
import { runQualityAgent } from './quality-agent';
import { qualityAgentResultSchema } from './quality-agent.schemas';
import { runSearchAgent } from './search-agent';

export { orchestratorRequestSchema, orchestratorResultSchema, type OrchestratorResult } from './orchestrator.schemas';

type Options = {
  // Server-owned configuration/dependencies only; never deserialize options from the browser.
  signal?: AbortSignal;
  onProgress?: (stage: AiStage) => void;
  limits?: unknown;
  planner?: OrchestratorPlanner;
  google?: GooglePlannerOptions;
  searchAgent?: typeof runSearchAgent;
  qualityAgent?: typeof runQualityAgent;
};

export async function runOrchestrator(input: unknown, options: Options = {}): Promise<OrchestratorResult> {
  const usage: OrchestratorUsage = { plannerCalls: 0, toolCallsReserved: 0, inputTokens: null, outputTokens: null, totalTokens: null };
  const fail = (code: OrchestratorFailure): OrchestratorResult => ({ status: 'failed', code, usage: { ...usage } });
  const request = orchestratorRequestSchema.safeParse(input);
  if (!request.success) return fail('invalid_request');
  const parsedLimits = orchestratorLimitsSchema.safeParse(options.limits ?? {});
  if (!parsedLimits.success) return fail('invalid_configuration');
  const limits = parsedLimits.data;
  const deadline = createDeadline(limits.timeoutMs, options.signal);
  try {
    deadline.check();
    options.onProgress?.('planning');
    usage.plannerCalls = 1;
    const planned = await awaitWithSignal(() => (options.planner ?? createGooglePlanner(options.google))(
      request.data, { signal: deadline.signal, limits },
    ), deadline.signal);
    deadline.check();
    const reported = plannerUsageSchema.safeParse(planned.usage);
    if (!reported.success) return fail('invalid_provider_usage');
    Object.assign(usage, reported.data);
    if (reported.data.inputTokens > limits.maxInputTokens || reported.data.outputTokens > limits.maxOutputTokens
      || reported.data.totalTokens > limits.maxTotalTokens) return fail('token_budget_exceeded');
    const decision = orchestratorDecisionSchema.safeParse(planned.decision);
    if (!decision.success) return fail('invalid_plan');
    if (decision.data.intent === 'unsupported') return { status: 'unsupported', code: 'unsupported_request', usage };
    const plan = compileOrchestratorPlan(decision.data, request.data);
    if (plan.calls.length > limits.maxToolCalls) return fail('tool_budget_exceeded');
    usage.toolCallsReserved = plan.calls.length;
    deadline.check();
    options.onProgress?.('searching');
    const searchResult = await awaitWithSignal(() => (options.searchAgent ?? runSearchAgent)(plan, {
      signal: deadline.signal, timeoutMs: limits.toolTimeoutMs, maxToolCalls: limits.maxToolCalls,
    }), deadline.signal);
    deadline.check();
    // Build selections only from server Search evidence; model-authored prose/IDs are not presentation authority.
    options.onProgress?.('validating');
    const candidates = Array.isArray(searchResult?.movies) ? searchResult.movies.slice(0, 20).map(movie => ({ movieId: movie.id })) : [];
    const presentation = qualityAgentResultSchema.safeParse((options.qualityAgent ?? runQualityAgent)(searchResult, { movies: candidates }));
    deadline.check();
    if (!presentation.success) return fail('quality_rejected');
    if (presentation.data.status === 'unavailable') return fail('search_unavailable');
    if (presentation.data.status === 'rejected') return fail('quality_rejected');
    const result = {
      status: decision.data.intent === 'clarify_movie' && presentation.data.movies.length > 0 ? 'needs_selection' : 'completed',
      intent: decision.data.intent,
      presentation: presentation.data,
      usage,
    };
    const validated = orchestratorResultSchema.safeParse(result);
    return validated.success ? validated.data : fail('internal_error');
  } catch (error) {
    if (deadline.signal.aborted) return fail(deadline.failureCode());
    if (error instanceof PlannerFailure) {
      const reported = plannerUsageSchema.safeParse(error.usage);
      if (reported.success) Object.assign(usage, reported.data);
      const validated = orchestratorResultSchema.safeParse(fail(error.code));
      return validated.success ? validated.data : fail('internal_error');
    }
    return fail('internal_error');
  } finally {
    deadline.dispose();
  }
}
