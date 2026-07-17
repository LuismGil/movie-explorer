import 'server-only';
import { z } from 'zod';

const mcpEnvSchema = z.object({
  MCP_SERVER_URL: z.string().url().default('http://127.0.0.1:3001/mcp'),
  MCP_INTERNAL_API_KEY: z.string().min(32),
});

export type McpEnv = z.infer<typeof mcpEnvSchema>;

let mcpEnvCache: McpEnv | null = null;

export function _resetMcpEnvCacheForTesting() {
  mcpEnvCache = null;
}

export function getMcpEnv(): McpEnv {
  if (mcpEnvCache) {
    return mcpEnvCache;
  }

  // We only parse at runtime when requested to avoid crashing the build
  // if these secrets are not present in the environment (e.g. CI/CD or SSG).
  const parsed = mcpEnvSchema.safeParse(process.env);
  
  if (!parsed.success) {
    // We explicitly do not log the values or the error details containing values to avoid leaking secrets
    console.error('Failed to validate MCP environment configuration.');
    throw new Error('Invalid MCP environment configuration. Ensure MCP_INTERNAL_API_KEY is correctly set.');
  }

  mcpEnvCache = parsed.data;
  return mcpEnvCache;
}
