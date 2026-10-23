import 'server-only';
import { performance } from 'node:perf_hooks';

export const AI_AGENTS = ['planner', 'search', 'quality'] as const;
export const MCP_TOOLS = [
  'search_movies',
  'get_movie_details',
  'get_recommendations',
  'get_trending',
  'get_credits',
] as const;

export type AiAgent = (typeof AI_AGENTS)[number];
export type McpTool = (typeof MCP_TOOLS)[number];

type AgentMetrics = {
  calls: number;
  failures: number;
  totalLatencyMs: number;
  tokenReports: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

type ToolMetrics = {
  calls: number;
  failures: number;
  totalLatencyMs: number;
  maxLatencyMs: number;
};

type Metrics = {
  agents: Record<AiAgent, AgentMetrics>;
  tools: Record<McpTool, ToolMetrics>;
};

const MAX_COUNTER = Number.MAX_SAFE_INTEGER;

function emptyAgentMetrics(): AgentMetrics {
  return { calls: 0, failures: 0, totalLatencyMs: 0, tokenReports: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 };
}

function emptyToolMetrics(): ToolMetrics {
  return { calls: 0, failures: 0, totalLatencyMs: 0, maxLatencyMs: 0 };
}

function createMetrics(): Metrics {
  return {
    agents: Object.fromEntries(AI_AGENTS.map(agent => [agent, emptyAgentMetrics()])) as Record<AiAgent, AgentMetrics>,
    tools: Object.fromEntries(MCP_TOOLS.map(tool => [tool, emptyToolMetrics()])) as Record<McpTool, ToolMetrics>,
  };
}

type MetricsGlobal = typeof globalThis & { __movieExplorerAiMetricsV1?: Metrics };
const metricsRuntime = globalThis as MetricsGlobal;

function getMetrics(): Metrics {
  return metricsRuntime.__movieExplorerAiMetricsV1 ??= createMetrics();
}

function add(current: number, value: number): number {
  return Math.min(MAX_COUNTER, current + Math.max(0, Math.floor(value)));
}

function latency(value: number): number {
  return Number.isFinite(value) ? Math.min(MAX_COUNTER, Math.max(0, Math.round(value))) : 0;
}

export function recordAgentCall(agent: AiAgent, durationMs: number, failed: boolean): void {
  const entry = getMetrics().agents[agent];
  entry.calls = add(entry.calls, 1);
  entry.failures = add(entry.failures, failed ? 1 : 0);
  entry.totalLatencyMs = add(entry.totalLatencyMs, latency(durationMs));
}

export function recordPlannerTokenUsage(usage: { inputTokens: number; outputTokens: number; totalTokens: number }): void {
  const entry = getMetrics().agents.planner;
  entry.tokenReports = add(entry.tokenReports, 1);
  entry.inputTokens = add(entry.inputTokens, usage.inputTokens);
  entry.outputTokens = add(entry.outputTokens, usage.outputTokens);
  entry.totalTokens = add(entry.totalTokens, usage.totalTokens);
}

export function recordToolCall(tool: McpTool, durationMs: number, failed: boolean): void {
  const entry = getMetrics().tools[tool];
  const elapsed = latency(durationMs);
  entry.calls = add(entry.calls, 1);
  entry.failures = add(entry.failures, failed ? 1 : 0);
  entry.totalLatencyMs = add(entry.totalLatencyMs, elapsed);
  entry.maxLatencyMs = Math.max(entry.maxLatencyMs, elapsed);
}

export async function measureAgent<T>(
  agent: AiAgent,
  operation: () => Promise<T>,
  isFailure: (result: T) => boolean = () => false,
): Promise<T> {
  const startedAt = performance.now();
  let failed = true;
  try {
    const result = await operation();
    failed = isFailure(result);
    return result;
  } finally {
    recordAgentCall(agent, performance.now() - startedAt, failed);
  }
}

export function measureAgentSync<T>(
  agent: AiAgent,
  operation: () => T,
  isFailure: (result: T) => boolean = () => false,
): T {
  const startedAt = performance.now();
  let failed = true;
  try {
    const result = operation();
    failed = isFailure(result);
    return result;
  } finally {
    recordAgentCall(agent, performance.now() - startedAt, failed);
  }
}

function tokenUsage(agent: AiAgent, entry: AgentMetrics) {
  if (agent === 'planner') {
    return {
      reports: entry.tokenReports,
      inputTokens: entry.tokenReports ? entry.inputTokens : null,
      outputTokens: entry.tokenReports ? entry.outputTokens : null,
      totalTokens: entry.tokenReports ? entry.totalTokens : null,
    };
  }

  // Search and Quality are deterministic stages; they consume no model tokens.
  return { reports: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 };
}

export function getAiTelemetrySnapshot() {
  const metrics = getMetrics();
  const agents = Object.fromEntries(AI_AGENTS.map(agent => {
    const entry = metrics.agents[agent];
    return [agent, {
      calls: entry.calls,
      failures: entry.failures,
      totalLatencyMs: entry.totalLatencyMs,
      tokenUsage: tokenUsage(agent, entry),
    }];
  })) as Record<AiAgent, {
    calls: number;
    failures: number;
    totalLatencyMs: number;
    tokenUsage: ReturnType<typeof tokenUsage>;
  }>;

  const tools = Object.fromEntries(MCP_TOOLS.map(tool => [tool, { ...metrics.tools[tool] }])) as Record<McpTool, ToolMetrics>;
  return {
    scope: 'process-local' as const,
    generatedAt: new Date().toISOString(),
    agents,
    tools,
  };
}

/** Test-only reset; production callers should only read aggregate snapshots. */
export function resetAiTelemetryForTests(): void {
  metricsRuntime.__movieExplorerAiMetricsV1 = createMetrics();
}
