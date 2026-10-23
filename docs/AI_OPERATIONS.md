# AI Operations — Phase 6.8

## Caching and data retention

- Do not cache prompts, user messages, Search evidence, Quality presentations, model decisions, or provider/MCP payloads. The AI request/response path uses `no-store` and `no-transform`.
- The MCP client reuses only its initialized process-local connection. It does not retain tool results.
- Telemetry retains bounded aggregate counters in the current Node process only. Labels are a fixed set of three agents and five MCP tools; no request IDs, user identifiers, movie titles, prompts, results, credentials, or exception text are recorded.
- Process restarts and serverless instance changes reset/separate metrics. These are operational samples, not durable billing records or global production totals.

## Limits and activation gate

The Orchestrator enforces one planner invocation, at most five planned MCP calls, 4,096 input / 512 output / 4,608 total model tokens, a 30-second total deadline, and a 10-second MCP initialization/per-tool deadline. It has no retry or model fallback.

The public AI route is still server-disabled. Same-origin checks and request/response byte limits are not abuse protection. No distributed rate-limit store is configured or approved, and process-local throttling would not be reliable across Vercel instances. Do not enable generation until an appropriate shared rate-limit mechanism is reviewed and configured, in addition to provider/billing/privacy approval and the integration checks in [`DEPLOYMENT.md`](DEPLOYMENT.md).

## Aggregate telemetry

`GET /api/telemetry/tokens` returns counts, cumulative latency, and reported token totals by planner/search/quality, plus fixed per-tool call/failure/latency counters. Search and Quality report zero model tokens because they are deterministic. Planner token values are `null` until a provider reports usage; missing usage is not interpreted as free.

The route is uncached and requires `Authorization: Bearer <AI_TELEMETRY_API_KEY>`. The optional key must be at least 32 characters. If it is missing or invalid, the route fails closed (503/401). Never place it in a `NEXT_PUBLIC_` variable or browser request.

The app test suite runs ten mocked Orchestrator requests and verifies the endpoint's per-agent aggregate totals. This validates aggregation and authorization, not live provider billing or durable/cross-instance behavior.

Run `npm run verify:mcp:remote` with `MCP_INTERNAL_API_KEY` set in local `.env.local` to exercise all five tools through the server-only adapter. It logs only aggregate outcomes/timing and never calls Google. It refuses non-Render endpoints. Do not paste the secret into chat or command history.
