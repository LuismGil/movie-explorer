import 'server-only';
import { z } from 'zod';
import { containsCredentialReference, qualityAgentResultSchema, sanitizeQualityText } from './quality-agent.schemas';

export const ORCHESTRATOR_MODEL = 'gemini-3.1-flash-lite' as const;
export const orchestratorLimitsSchema = z.strictObject({
  timeoutMs: z.number().int().min(1).max(30000).default(30000),
  toolTimeoutMs: z.number().int().min(1).max(10000).default(10000),
  maxToolCalls: z.number().int().min(1).max(5).default(5),
  maxInputTokens: z.number().int().min(1).max(4096).default(4096),
  maxOutputTokens: z.number().int().min(1).max(512).default(512),
  maxTotalTokens: z.number().int().min(1).max(4608).default(4608),
});

const positiveId = z.number().int().positive();
const cleanQuery = z.string().trim().min(1).max(100)
  .refine(value => value === sanitizeQualityText(value) && !containsCredentialReference(value));
export const orchestratorRequestSchema = z.strictObject({
  message: z.string().trim().min(1).max(1000)
    .refine(value => !containsCredentialReference(value))
    .transform(sanitizeQualityText).pipe(z.string().min(1).max(1000).refine(value => !containsCredentialReference(value))),
  referenceMovieId: positiveId.optional(),
});

export const orchestratorDecisionSchema = z.strictObject({
  intent: z.enum(['search', 'trending', 'details', 'recommendations', 'credits', 'clarify_movie', 'unsupported']),
  queries: z.array(cleanQuery).max(3),
  movieId: positiveId.nullable(),
  window: z.enum(['day', 'week']).nullable(),
}).superRefine((decision, ctx) => {
  const queryIntent = decision.intent === 'search' || decision.intent === 'clarify_movie';
  const idIntent = ['details', 'recommendations', 'credits'].includes(decision.intent);
  const valid = queryIntent
    ? decision.queries.length > 0 && (decision.intent !== 'clarify_movie' || decision.queries.length === 1)
      && decision.movieId === null && decision.window === null
    : decision.queries.length === 0 && (idIntent ? decision.movieId !== null : decision.movieId === null)
      && (decision.intent === 'trending' ? decision.window !== null : decision.window === null);
  if (!valid) ctx.addIssue({ code: 'custom', message: 'Inconsistent intent fields' });
});

export const plannerUsageSchema = z.strictObject({
  inputTokens: z.number().int().positive(),
  outputTokens: z.number().int().positive(),
  totalTokens: z.number().int().positive(),
}).refine(usage => usage.totalTokens >= usage.inputTokens + usage.outputTokens);

const usageSchema = z.strictObject({
  plannerCalls: z.number().int().min(0).max(1),
  toolCallsReserved: z.number().int().min(0).max(5),
  inputTokens: z.number().int().nonnegative().nullable(),
  outputTokens: z.number().int().nonnegative().nullable(),
  totalTokens: z.number().int().nonnegative().nullable(),
});
export const orchestratorFailureSchema = z.enum([
  'invalid_request', 'invalid_configuration', 'provider_disabled', 'provider_auth', 'provider_quota',
  'provider_unavailable', 'invalid_plan', 'invalid_provider_usage', 'token_budget_exceeded',
  'tool_budget_exceeded', 'deadline_exceeded', 'cancelled', 'search_unavailable', 'quality_rejected',
  'internal_error',
]);
const presentationSchema = qualityAgentResultSchema.refine(value => !['rejected', 'unavailable'].includes(value.status));
export const orchestratorResultSchema = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('completed'), intent: orchestratorDecisionSchema.shape.intent.exclude(['unsupported']), presentation: presentationSchema, usage: usageSchema }),
  z.strictObject({ status: z.literal('needs_selection'), intent: z.literal('clarify_movie'), presentation: presentationSchema.refine(value => value.movies.length > 0), usage: usageSchema }),
  z.strictObject({ status: z.literal('unsupported'), code: z.literal('unsupported_request'), usage: usageSchema }),
  z.strictObject({ status: z.literal('failed'), code: orchestratorFailureSchema, usage: usageSchema }),
]);

export type OrchestratorRequest = z.infer<typeof orchestratorRequestSchema>;
export type OrchestratorDecision = z.infer<typeof orchestratorDecisionSchema>;
export type OrchestratorLimits = z.infer<typeof orchestratorLimitsSchema>;
export type PlannerUsage = z.infer<typeof plannerUsageSchema>;
export type OrchestratorUsage = z.infer<typeof usageSchema>;
export type OrchestratorFailure = z.infer<typeof orchestratorFailureSchema>;
export type OrchestratorResult = z.infer<typeof orchestratorResultSchema>;

export type OrchestratorPlanner = (request: OrchestratorRequest, options: {
  signal: AbortSignal; limits: OrchestratorLimits;
}) => Promise<{ decision: unknown; usage: unknown }>;

export class PlannerFailure extends Error {
  constructor(readonly code: OrchestratorFailure, readonly usage?: PlannerUsage) {
    super(code);
    this.name = 'PlannerFailure';
  }
}
