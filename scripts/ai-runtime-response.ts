import { z } from 'zod';

const probe = z.strictObject({ status: z.enum(['passed', 'failed', 'not_run']), elapsedMs: z.number().int().nonnegative().max(60_000) });
const resultSchema = z.strictObject({
  status: z.enum(['passed', 'failed']), elapsedMs: z.number().int().nonnegative().max(60_000),
  checks: z.strictObject({ upstash: probe, mcp: probe }),
});
const configurationFailureSchema = z.strictObject({
  error: z.literal('configuration_invalid'),
  variables: z.array(z.enum([
    'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'MCP_SERVER_URL', 'MCP_INTERNAL_API_KEY',
  ])).min(1).max(4),
});
const errorSchema = z.strictObject({ error: z.enum(['operator_configuration_invalid', 'unauthorized', 'invalid_request', 'unavailable']) });

/** Only allowlisted response fields may reach terminal output; never echo raw response text. */
export function runtimeCheckReport(httpStatus: number, body: unknown): { passed: boolean; message: string } {
  const result = resultSchema.safeParse(body);
  if (result.success && (httpStatus === 200 || httpStatus === 503)) {
    return {
      passed: httpStatus === 200 && result.data.status === 'passed'
        && result.data.checks.upstash.status === 'passed' && result.data.checks.mcp.status === 'passed',
      message: JSON.stringify(result.data),
    };
  }
  const configuration = configurationFailureSchema.safeParse(body);
  if (httpStatus === 503 && configuration.success) {
    return { passed: false, message: `Vercel configuration is missing or invalid: ${configuration.data.variables.join(', ')}. No dependency checks ran. Values are not shown.` };
  }
  const error = errorSchema.safeParse(body);
  if (error.success) {
    if (httpStatus === 503 && error.data.error === 'operator_configuration_invalid') {
      return { passed: false, message: 'The deployed AI_RUNTIME_CHECK_API_KEY is missing or has an invalid format. No dependency checks ran. Check Vercel Production and deploy after saving it; do not share the token.' };
    }
    if (httpStatus === 401 && error.data.error === 'unauthorized') {
      return { passed: false, message: 'Operator authentication failed: the local token does not match the deployed token, or its Authorization header was not accepted. No dependency checks ran. Do not share either token.' };
    }
    if (httpStatus === 503 && error.data.error === 'unavailable') {
      return { passed: false, message: 'The deployed diagnostic returned the older generic configuration error. Deploy the updated diagnostic to identify the invalid setting; no raw response logged.' };
    }
  }
  return { passed: false, message: `Runtime check returned HTTP ${httpStatus} with an unrecognized response. Check the active deployment and Vercel logs privately; no response content logged. No automatic retry.` };
}
