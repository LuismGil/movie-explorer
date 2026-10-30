import { z } from 'zod';
import { qualityAgentResultSchema } from './presentation';

export const AI_STREAM_MAX_BYTES = 2 * 1024 * 1024;
export const aiStages = ['planning', 'searching', 'validating'] as const;
export const aiErrorCodeSchema = z.enum(['invalid_request', 'disabled', 'region_unavailable', 'unavailable', 'quota_exceeded', 'rate_limited', 'timeout', 'cancelled', 'unsafe_result', 'invalid_stream']);
const presentation = qualityAgentResultSchema.refine(value =>
  ['approved', 'partial', 'empty'].includes(value.status)
  && (value.status !== 'empty' || value.movies.length === 0)
  && (value.status !== 'approved' || value.movies.length > 0));
export const aiStreamEventSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('progress'), stage: z.enum(aiStages) }),
  z.strictObject({ type: z.literal('result'), status: z.enum(['completed', 'needs_selection']), presentation })
    .refine(event => event.status !== 'needs_selection' || event.presentation.movies.length > 0),
  z.strictObject({ type: z.literal('unsupported') }),
  z.strictObject({ type: z.literal('error'), code: aiErrorCodeSchema }),
]);
export type AiStage = typeof aiStages[number];
export type AiStreamEvent = z.infer<typeof aiStreamEventSchema>;
export type AiTerminalEvent = Exclude<AiStreamEvent, { type: 'progress' }>;
export type AiErrorCode = z.infer<typeof aiErrorCodeSchema>;
