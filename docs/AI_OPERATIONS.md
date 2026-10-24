# AI Operations — Phase 6.8

## Caching and data retention

- Do not cache prompts, user messages, Search evidence, Quality presentations, model decisions, or provider/MCP payloads. The AI request/response path uses `no-store` and `no-transform`.
- The MCP client reuses only its initialized process-local connection. It does not retain tool results.
- Telemetry retains bounded aggregate counters in the current Node process only. Labels are a fixed set of three agents and five MCP tools; no request IDs, user identifiers, movie titles, prompts, results, credentials, or exception text are recorded.
- Process restarts and serverless instance changes reset/separate metrics. These are operational samples, not durable billing records or global production totals.

## Limits and activation gate

The Orchestrator enforces one planner invocation, at most five planned MCP calls, 4,096 input / 512 output / 4,608 total model tokens, a 30-second total deadline, and a 10-second MCP initialization/per-tool deadline. It has no retry or model fallback.

The public AI route is still server-disabled. Same-origin checks and request/response byte limits are not authentication. **Approved free-only policy (2026-10-23):** Upstash Redis Free, with no payment method or paid plan, stores one global admission counter. The implementation is local and tested; the operator has not yet provisioned/configured the hosted database. Do not enable generation until hosted admission is verified along with provider/billing/privacy approval and the integration checks in [`DEPLOYMENT.md`](DEPLOYMENT.md).

### Minimal shared admission policy

- **One admission every 60 seconds for the entire demo**, not per visitor or Vercel instance.
- **At most ten admissions in a rolling 24-hour window**, not a reset at calendar midnight. Follow-up selections and explicit retries also need a new admission.
- An atomic Redis `EVAL` reads the Redis clock, removes expired entries, checks both limits, and records an admission. There is one fixed sorted-set key with at most ten timestamps and a 24-hour expiry after the last admission. No IPs, cookies, visitor identifiers, prompt data, or model/movie results are stored.
- Every deployment using the same database shares the same key; do not create separate counters to increase the budget. The limiter is mandatory before Orchestrator/provider/MCP execution on the enabled public route. Existing movie-title search/watchlist flows are unaffected.
- Failed, cancelled, unsupported, and lost-response attempts consume their reservation. No refunds, automatic retries, local-memory fallback, or alternate-model escalation. Redis/HTTP/configuration failures deny access before generation. A network failure after Redis has accepted a request may consume a slot without a pipeline invocation.
- Maximum limiter waiting: **2 seconds**, including response-body reading, with cancellation propagation and a 1 KiB response cap. Only credential-free root `https://<database>.upstash.io` endpoints are accepted; redirects are rejected and errors are sanitized.
- Denial returns HTTP **429**, `Retry-After` (bounded 1–86,400 seconds), and only `error/rate_limited`. The UI explains the shared free-demo limit, disables submissions during the cooldown, and does not retry automatically. Storage unavailability returns controlled HTTP 503.
- Checks run only after a valid request and the server availability gate: disabled/invalid requests do not use Upstash quota. A sustained attack can still exhaust the storage's Free quota or hosting resources, resulting in denial of service; this limiter is not a firewall, user authentication, a billing guarantee, or comprehensive DDoS protection. It intentionally prioritizes blocking inference over availability. Even one visitor can consume all ten slots.

These are application limits, not a claim about the account's available Gemini RPM/TPM/RPD. Google quotas are per project across keys; the actual limits must be checked in AI Studio. An admitted pipeline can make one `countTokens` and one generation request. Existing token ceilings remain unchanged; no quota/billing dashboard settings were inspected.

### Why not Render's free memory store?

Render documents that Free Key Value data disappears on restart. An in-memory counter or local file in the MCP web service also resets on restart/idle spin-down. That is unsuitable as the sole 24-hour shared admission history. Render Free web services sleep after 15 minutes of inactivity and can take about a minute to wake; no keep-alive polling or relaxed/unbounded timeout is introduced here.

### Operator setup — no paid usage

1. Create an Upstash account and **one Redis database on the Free plan**. No payment method is needed. Do not use the temporary agent-provisioned database flow; its unclaimed databases expire after three days. No resource was created by this implementation.
2. Confirm Free in the dashboard and keep eviction disabled so counters cannot be evicted to admit extra work. Use a dedicated database for this counter; do not delete/recreate or manually clear it to bypass the daily cap. **Do not add a card:** Upstash documents automatic migration to pay-as-you-go after a payment method is added.
3. Copy its HTTPS REST URL and REST token privately into root `.env.local`, preserving other settings:

   ```dotenv
   UPSTASH_REDIS_REST_URL=https://YOUR-DATABASE.upstash.io
   UPSTASH_REDIS_REST_TOKEN=YOUR_PRIVATE_REST_TOKEN
   ```

4. Save the same two values as server-side Vercel Production environment variables (Preview only if needed). Never use `NEXT_PUBLIC_`, commit the token, or send it in chat/screenshots. A Vercel redeploy is needed to apply changed environment values; the public AI and Google gates must remain disabled. No Upstash configuration is needed on Render.
5. Check [AI Studio Projects](https://aistudio.google.com/projects) shows Free for the dedicated Google project and does not have an active paid billing account; do not select Set up billing, purchase credits, or enable auto-reload. Check the project's actual [active rate limits](https://aistudio.google.com/rate-limit). If its available quota is lower than this demo policy, keep generation disabled until limits are lowered accordingly. Free-tier eligibility is user-reported, not independently verified here.
6. Check Render's Billing/Monthly Included Usage. Its documentation warns that bandwidth/build overages can be billed when a payment method exists, even on Free compute. Do not change billing automatically; with no payment method Render documents suspension/build blocking rather than supplementary billing. Keep any build spend limit at zero where available. This code cannot impose a hard platform-wide spending cap.
7. Report only that setup is complete. A separate explicitly approved hosted-counter check must still verify actual configuration and atomic behavior without invoking Google, before this gate can be marked closed. The tests below use **only a local Redis**, not the hosted Free database.

### Verification

`npm test -- --run` covers configuration/response schemas, redirect policy, byte/time caps, cancellation, fail-closed route handling, no pipeline on 429/503, and UI cooldown/no auto-retry. `npm run test:ai:rate-limit` starts an isolated local `redis:7-alpine` container without network access or published ports, runs the real atomic Lua script with independent handlers, then removes the container. The same local integration check is included in CI; no hosted credential is needed. This verifies concurrency, rolling windows, expiry and server-clock behavior, **not** Upstash account status or hosted availability.

Official references checked 2026-10-23: [Render Free limits](https://render.com/docs/free), [Render Key Value persistence](https://render.com/docs/key-value#data-persistence), [Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits), [Gemini billing](https://ai.google.dev/gemini-api/docs/billing), [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.1-flash-lite), [Upstash Free pricing](https://upstash.com/docs/redis/overall/pricing), [durability](https://upstash.com/docs/redis/features/durability), [atomic EVAL](https://upstash.com/docs/redis/commands/scripting/eval), [server TIME](https://upstash.com/docs/redis/commands/server/time).

## Aggregate telemetry

`GET /api/telemetry/tokens` returns counts, cumulative latency, and reported token totals by planner/search/quality, plus fixed per-tool call/failure/latency counters. Search and Quality report zero model tokens because they are deterministic. Planner token values are `null` until a provider reports usage; missing usage is not interpreted as free.

The route is uncached and requires `Authorization: Bearer <AI_TELEMETRY_API_KEY>`. The optional key must be at least 32 characters. If it is missing or invalid, the route fails closed (503/401). Never place it in a `NEXT_PUBLIC_` variable or browser request.

The app test suite runs ten mocked Orchestrator requests and verifies the endpoint's per-agent aggregate totals. This validates aggregation and authorization, not live provider billing or durable/cross-instance behavior.

Run `npm run verify:mcp:remote` with `MCP_INTERNAL_API_KEY` set in local `.env.local` to exercise all five tools through the server-only adapter. It logs only aggregate outcomes/timing and never calls Google. It refuses non-Render endpoints. Do not paste the secret into chat or command history.
