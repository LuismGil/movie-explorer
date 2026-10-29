import dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'], quiet: true });

const expectedOrigin = 'https://movie-explorer-ppc2.onrender.com';
const configuredUrl = process.env.MCP_SERVER_URL ?? `${expectedOrigin}/mcp`;
const internalKey = process.env.MCP_INTERNAL_API_KEY;

if (!internalKey || internalKey.length < 32) {
  console.error('Remote MCP check not run: set MCP_INTERNAL_API_KEY locally (at least 32 characters); never paste it into chat.');
  process.exitCode = 2;
} else {
  let endpoint: URL | undefined;
  try {
    endpoint = new URL(configuredUrl);
  } catch {
    console.error('Remote MCP check not run: MCP_SERVER_URL is invalid.');
    process.exitCode = 2;
  }

  if (process.exitCode !== 2) {
    if (!endpoint || endpoint.origin !== expectedOrigin || endpoint.pathname !== '/mcp'
      || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
      console.error('Remote MCP check not run: only the documented HTTPS Render /mcp endpoint is allowed.');
      process.exitCode = 2;
    } else {
      // Make the verified remote target explicit for getMcpEnv, whose normal app default is localhost.
      process.env.MCP_SERVER_URL = endpoint.href;
      const { runSearchAgent } = await import('../src/server/agents/search-agent');
      const { closeMcpClient } = await import('../src/server/mcp/client');
      const startedAt = performance.now();
      try {
        const result = await runSearchAgent({ calls: [
          { tool: 'search_movies', query: 'Inception', page: 1 },
          { tool: 'get_movie_details', movieId: '27205' },
          { tool: 'get_recommendations', movieId: '27205' },
          { tool: 'get_trending', window: 'week' },
          { tool: 'get_credits', movieId: '27205' },
        ] }, { maxToolCalls: 5, timeoutMs: 10000 });

        const outcomes = result.outcomes.map(outcome => ({ tool: outcome.tool, status: outcome.status }));
        console.log(JSON.stringify({
          status: result.status,
          elapsedMs: Math.round(performance.now() - startedAt),
          movieCount: result.movies.length,
          outcomes,
        }));
        if (result.status !== 'complete' || outcomes.some(outcome => outcome.status !== 'succeeded')) process.exitCode = 1;
      } catch {
        console.error('Remote MCP integration check failed; no request content or credentials were logged.');
        process.exitCode = 1;
      } finally {
        await closeMcpClient().catch(() => undefined);
      }
    }
  }
}
