// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { runtimeCheckReport } from '../ai-runtime-response';

const passed = { status: 'passed', elapsedMs: 120, checks: {
  upstash: { status: 'passed', elapsedMs: 20 }, mcp: { status: 'passed', elapsedMs: 100 },
} };

describe('safe runtime check terminal reports', () => {
  it('accepts aggregate successful probe results only with HTTP 200', () => {
    expect(runtimeCheckReport(200, passed)).toEqual({ passed: true, message: JSON.stringify(passed) });
    expect(runtimeCheckReport(503, passed).passed).toBe(false);
    expect(runtimeCheckReport(401, passed).passed).toBe(false);
  });

  it('retains sanitized failed probe results without treating them as successful', () => {
    const failed = { ...passed, status: 'failed', checks: { ...passed.checks, mcp: { status: 'failed', elapsedMs: 100 } } };
    expect(runtimeCheckReport(503, failed)).toEqual({ passed: false, message: JSON.stringify(failed) });
    expect(runtimeCheckReport(200, failed).passed).toBe(false);
  });

  it.each(['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'MCP_SERVER_URL', 'MCP_INTERNAL_API_KEY'])(
    'names only the allowlisted invalid variable %s', variable => {
      const result = runtimeCheckReport(503, { error: 'configuration_invalid', variables: [variable] });
      expect(result.passed).toBe(false);
      expect(result.message).toContain(variable);
      expect(result.message).toContain('No dependency checks ran');
    },
  );

  it('distinguishes an invalid deployed diagnostic token from authentication mismatch', () => {
    expect(runtimeCheckReport(503, { error: 'operator_configuration_invalid' }).message).toContain('missing or has an invalid format');
    expect(runtimeCheckReport(401, { error: 'unauthorized' }).message).toContain('Operator authentication failed');
  });

  it('does not misidentify the old ambiguous response as a specific invalid setting', () => {
    expect(runtimeCheckReport(503, { error: 'unavailable' }).message).toContain('older generic configuration error');
  });

  it.each([
    { error: 'configuration_invalid', variables: ['private-secret'] },
    { error: 'configuration_invalid', variables: ['MCP_SERVER_URL'], raw: 'private-secret' },
    { error: 'configuration_invalid', variables: [] },
    { error: 'operator_configuration_invalid', raw: 'private-secret' },
    { error: 'private-secret' },
    { ...passed, raw: 'private-secret' },
    { ...passed, checks: { ...passed.checks, mcp: { status: 'private-secret', elapsedMs: 100 } } },
    '<html>private-secret</html>', undefined, null,
  ])('never prints unknown or extra response data %#', body => {
    const result = runtimeCheckReport(503, body);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('unrecognized response');
    expect(result.message).not.toContain('private-secret');
  });

  it('does not trust configuration or authentication codes under the wrong HTTP status', () => {
    expect(runtimeCheckReport(200, { error: 'configuration_invalid', variables: ['MCP_SERVER_URL'] }).message).toContain('unrecognized response');
    expect(runtimeCheckReport(503, { error: 'unauthorized' }).message).toContain('unrecognized response');
  });
});
