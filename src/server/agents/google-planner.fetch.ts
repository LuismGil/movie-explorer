import 'server-only';
import { z } from 'zod';
import { ORCHESTRATOR_MODEL, PlannerFailure, type OrchestratorLimits } from './orchestrator.schemas';

const baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/';
const generationURL = `${baseURL}${ORCHESTRATOR_MODEL}:generateContent`;
const countURL = `${baseURL}${ORCHESTRATOR_MODEL}:countTokens`;
const countSchema = z.object({ totalTokens: z.number().int().positive() });

export function providerStatusFailure(status: number): PlannerFailure {
  return new PlannerFailure(status === 429 ? 'provider_quota'
    : status === 401 || status === 403 ? 'provider_auth' : 'provider_unavailable');
}

/** Counts the SDK's actual wire request, including system/schema steering data. */
export function createBudgetedGoogleFetch(
  fetch: typeof globalThis.fetch,
  signal: AbortSignal,
  limits: OrchestratorLimits,
): typeof globalThis.fetch {
  let attempted = false;
  return async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    if (attempted || url !== generationURL || init?.method !== 'POST' || typeof init.body !== 'string') {
      throw new PlannerFailure('provider_unavailable');
    }
    attempted = true;
    if (signal.aborted) throw new PlannerFailure('cancelled');
    const request: unknown = JSON.parse(init.body);
    if (!request || typeof request !== 'object' || Array.isArray(request)) throw new PlannerFailure('invalid_plan');
    const count = await fetch(countURL, {
      method: 'POST', headers: init.headers, signal, redirect: 'error',
      body: JSON.stringify({ generateContentRequest: { ...request, model: `models/${ORCHESTRATOR_MODEL}` } }),
    });
    if (!count.ok) {
      await count.body?.cancel();
      throw providerStatusFailure(count.status);
    }
    const parsed = countSchema.safeParse(await count.json());
    if (!parsed.success) throw new PlannerFailure('invalid_provider_usage');
    if (parsed.data.totalTokens > limits.maxInputTokens
      || parsed.data.totalTokens + limits.maxOutputTokens > limits.maxTotalTokens) {
      throw new PlannerFailure('token_budget_exceeded');
    }
    if (signal.aborted) throw new PlannerFailure('cancelled');
    return fetch(input, { ...init, signal, redirect: 'error' });
  };
}
