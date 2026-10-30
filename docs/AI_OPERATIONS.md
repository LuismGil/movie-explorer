# AI Operations — Phase 6.8

## Latest operational evidence — 2026-10-29

One explicitly authorized real **local-handler** AI invocation passed: the production limiter admitted/recorded one request in the existing hosted counter, Google token preflight and generation each ran once (HTTP 200), one MCP search ran, Quality approved 12 movies and the stream consumer validated clean EOF. **237 reported tokens, 4,275ms** total. No refund/reset, retry, source/env change or public activation. This is separate from D4's Vercel→Upstash/Render checks; complete generative execution on Vercel remains unverified. The single-test authorization is consumed. [Full evidence](AI_LIVE_CHECK.md).

**Geographic policy (2026-10-30):** the user approved an AI-only block for EEA/CH/UK and unknown geolocation, leaving the catalog public worldwide. The server checks Vercel's country header before request-body processing/shared admission; the page also explains non-availability. This does not activate AI, log location, or prove age/audience eligibility. [Policy and release gates](AI_DEMO_DECISION.md).

The retired production diagnostic now returns GET/POST 404 after `e8b314c`; a presence-only check confirms its key is absent from local `.env`. Vercel removal and older-deployment cleanup remain unverified. Public availability stays false. Latest local checks after the geo gate: 369 tests pass (five opt-in Redis cases skipped), lint/types/build pass; the local retirement smoke also passed. No provider call or deployment occurred for the geo change.

## Caching and data retention

- Do not cache prompts, user messages, Search evidence, Quality presentations, model decisions, or provider/MCP payloads. The AI request/response path uses `no-store` and `no-transform`.
- The MCP client reuses only its initialized process-local connection. It does not retain tool results.
- Telemetry retains bounded aggregate counters in the current Node process only. Labels are a fixed set of three agents and five MCP tools; no request IDs, user identifiers, movie titles, prompts, results, credentials, or exception text are recorded.
- Process restarts and serverless instance changes reset/separate metrics. These are operational samples, not durable billing records or global production totals.

## Limits and activation gate

The Orchestrator enforces one planner invocation, at most five planned MCP calls, 4,096 input / 512 output / 4,608 total model tokens, and a 30-second total deadline. Shared MCP initialization is separately capped at 20 seconds; each MCP tool request remains capped at 10 seconds. The 30-second total deadline still wins, and there is no retry or model fallback. These are time limits, not a monetary budget; raising the initialization cap does not add model calls, tokens, or billing, but a pending request can hold the function open longer.

Render Free's observed authenticated MCP handshake took 13.889 seconds after a 16-minute period with no requests from our checks. The 20-second initialization cap gives modest margin for that observation, not a guarantee against Render's longer documented wake-ups. Total orchestration/route/UI limits remain 30/35/35 seconds, so slow or unresponsive requests still fail closed. When the public AI panel is enabled, a quiet pt-BR note explains that the first search after inactivity can take longer; the disabled production panel does not show a misleading startup notice.

The public AI route is still server-disabled. Same-origin checks and request/response byte limits are not authentication. **Approved free-only policy (2026-10-23):** Upstash Redis Free, with no payment method or paid plan, stores one global admission counter. Existing services Free/no-payment and eviction disabled are operator-confirmed, not independently inspected dashboard facts. D4 passed isolated operations from Vercel without touching the admission key; D5 subsequently consumed one normal shared admission for the authorized local real test. Do not repeat completed setup confirmations or reset that admission. Public generation remains off pending release decisions.

### Privacy and activation clarification — 2026-10-29

**Current decision:** operator in Brazil accepts Google's unpaid-service data use; do not request that acceptance again. Trusted Google composition and the pt-BR disclosure are prepared, with public availability false. The approved AI-only EEA/CH/UK/unknown-country gate is implemented; the catalog stays public. D4 dependency checks and one separately authorized D5 local real test have passed. Adult-audience eligibility, bounded startup acceptance and full enabled Vercel/browser release verification remain pending.

Google and the fixed model remain approved; the operator accepts Google's unpaid-service data use and asks to proceed with the demo, not migrate providers. The one authorized real local test confirmed access for that invocation; it does not establish adult-audience eligibility or verify Vercel execution. The new geo gate addresses the approved regional distribution restriction only. The existing Google adapter sends the submitted query/optional reference ID, static instructions and structured schema to Google, including during token preflight; it does not attach a visitor's entire account, files or watchlist. No local no-store or warning overrides provider content-use terms.

Google's general unpaid-service policy permits improvement use and human review; its EEA/UK/Swiss developer data-use exception must be distinguished from the separate Paid-only restriction for clients offered to users there, and from age/audience requirements. Establish developer region and intended audience before deciding applicability. No application switch guarantees a no-training/no-review Google Free arrangement. If the applicable conditions are declined, only that arrangement is unavailable; the app and completed architecture are not lost.

The production route derives its trusted Google assertion from server-owned public availability, still false. The input notice already includes applicable improvement use/human review disclosure. Do not enable public availability solely because the private local test passed. The D1–D5 sequence and remaining decisions are in [`AI_DEMO_DECISION.md`](AI_DEMO_DECISION.md). No alternative provider/model is selected.

### Minimal shared admission policy

- **One admission every 60 seconds for the entire demo**, not per visitor or Vercel instance.
- **At most ten admissions in a rolling 24-hour window**, not a reset at calendar midnight. Follow-up selections and explicit retries also need a new admission.
- An atomic Redis `EVAL` reads the Redis clock, removes expired entries, checks both limits, and records an admission. There is one fixed sorted-set key with at most ten timestamps and a 24-hour expiry after the last admission. No IPs, cookies, visitor identifiers, prompt data, or model/movie results are stored.
- Every deployment using the same database shares the same key; do not create separate counters to increase the budget. The limiter is mandatory before Orchestrator/provider/MCP execution on the enabled public route. Existing movie-title search/watchlist flows are unaffected.
- Failed, cancelled, unsupported, and lost-response attempts consume their reservation. No refunds, automatic retries, local-memory fallback, or alternate-model escalation. Redis/HTTP/configuration failures deny access before generation. A network failure after Redis has accepted a request may consume a slot without a pipeline invocation.
- Maximum limiter waiting: **2 seconds**, including response-body reading, with cancellation propagation and a 1 KiB response cap. Only credential-free root `https://<database>.upstash.io` endpoints are accepted; redirects are rejected and errors are sanitized.
- Denial returns HTTP **429**, `Retry-After` (bounded 1–86,400 seconds), and only `error/rate_limited`. The UI explains the shared free-demo limit, shows a real hours/minutes/seconds countdown outside the live status region, disables submissions during the cooldown and links to the ordinary catalog. An absolute client deadline is synchronized on tab visibility changes; expiry announces that manual retry is possible, not that a slot is reserved. No automatic retry or network polling occurs. Reloading can discard the client timer but cannot bypass server admission. Storage unavailability returns controlled HTTP 503.
- Checks run only after a valid request and the server availability gate: disabled/invalid requests do not use Upstash quota. A sustained attack can still exhaust the storage's Free quota or hosting resources, resulting in denial of service; this limiter is not a firewall, user authentication, a billing guarantee, or comprehensive DDoS protection. It intentionally prioritizes blocking inference over availability. Even one visitor can consume all ten slots.

These are application limits, not a claim about guaranteed Gemini capacity. Before the live test, the user reported AI Studio `0 / 60`, `0 / 100K`, `0 / 100`, apparently usage/limits for RPM, input TPM and RPD. Google quotas are per project across keys; the successful invocation verifies model access for that request, but selected project limits and billing status were not independently inspected. An admitted pipeline can make one `countTokens` and one generation request; both transmit submitted content. Existing token ceilings remain unchanged; no quota/billing dashboard settings were inspected.

**Portfolio UX decision (2026-10-29; geo policy added 2026-10-30):** direct public access without invitations/accounts/link requests. The quota countdown implements that low-friction exhaustion experience; the later AI-only EEA/CH/UK/unknown-country gate leaves the catalog public and does not enable generation. Current lint/types/build and 369 tests pass, including long-wait/tab-resume/no-auto-request and geo-gate coverage; five opt-in local Redis tests skipped.

### Why not Render's free memory store?

Render documents that Free Key Value data disappears on restart. An in-memory counter or local file in the MCP web service also resets on restart/idle spin-down. That is unsuitable as the sole 24-hour shared admission history. Render Free web services sleep after 15 minutes of inactivity and can take about a minute to wake; no keep-alive polling or unbounded timeout is introduced here.

### Operator setup — no paid usage

1. Create an Upstash account and **one Redis database on the Free plan**. No payment method is needed. Do not use the temporary agent-provisioned database flow; its unclaimed databases expire after three days. No resource was created by this implementation.
2. Confirm Free in the dashboard and keep eviction disabled so counters cannot be evicted to admit extra work. Use a dedicated database for this counter; do not delete/recreate or manually clear it to bypass the daily cap. **Do not add a card:** Upstash documents automatic migration to pay-as-you-go after a payment method is added.
3. Copy its HTTPS REST URL and REST token privately into root `.env` or `.env.local`, preserving other settings:

   ```dotenv
   UPSTASH_REDIS_REST_URL=https://YOUR-DATABASE.upstash.io
   UPSTASH_REDIS_REST_TOKEN=YOUR_PRIVATE_REST_TOKEN
   ```

4. Save the same two values as server-side Vercel Production environment variables (Preview only if needed). Never use `NEXT_PUBLIC_`, commit the token, or send it in chat/screenshots. A Vercel redeploy is needed to apply changed environment values; the user reports this was done and deployment returned Ready. The public AI and Google gates remain disabled. No Upstash configuration is needed on Render.
5. Check [AI Studio Projects](https://aistudio.google.com/projects) shows Free for the dedicated Google project and does not have an active paid billing account; do not select Set up billing, purchase credits, or enable auto-reload. Check the project's actual [active rate limits](https://aistudio.google.com/rate-limit). If its available quota is lower than this demo policy, keep generation disabled until limits are lowered accordingly. Free-tier eligibility is user-reported, not independently verified here.
6. Check Render's Billing/Monthly Included Usage. Its documentation warns that bandwidth/build overages can be billed when a payment method exists, even on Free compute. Do not change billing automatically; with no payment method Render documents suspension/build blocking rather than supplementary billing. Keep any build spend limit at zero where available. This code cannot impose a hard platform-wide spending cap.
7. A hosted REST PING and an atomic EVAL against a random temporary key (five-second expiry) passed from local `.env`, without touching the production counter or Google. D4 later passed these isolated operations from Vercel; D5 then consumed exactly one ordinary admission for the authorized local live test. Free/no-payment and eviction-disabled status remains operator-confirmed, not independently inspected. The CI tests below use **only a local Redis**.

### Verification

`npm test -- --run` covers configuration/response schemas, redirect policy, byte/time caps, cancellation, fail-closed route handling, no pipeline on 429/503, and UI cooldown/no auto-retry. `npm run test:ai:rate-limit` starts an isolated local `redis:7-alpine` container without network access or published ports, runs the real atomic Lua script with independent handlers, then removes the container. The same local integration check is included in CI; no hosted credential is needed. This verifies concurrency, rolling windows, expiry and server-clock behavior, **not** Upstash account status or hosted availability.

Official references checked 2026-10-23: [Render Free limits](https://render.com/docs/free), [Render Key Value persistence](https://render.com/docs/key-value#data-persistence), [Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits), [Gemini billing](https://ai.google.dev/gemini-api/docs/billing), [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.1-flash-lite), [Upstash Free pricing](https://upstash.com/docs/redis/overall/pricing), [durability](https://upstash.com/docs/redis/features/durability), [atomic EVAL](https://upstash.com/docs/redis/commands/scripting/eval), [server TIME](https://upstash.com/docs/redis/commands/server/time).

## Aggregate telemetry

### Temporary protected runtime verification — D4

The temporary POST `/api/internal/runtime-check` completed D4 verification (Upstash 83ms, MCP 928ms, total 1,015ms) without real admission-key access or Google. Its retirement `e8b314c` is pushed and production GET/POST both return 404. Local diagnostic-key absence is confirmed; Vercel/older-deployment cleanup remains unverified and destructive cleanup needs approval. This sample does not certify cold starts. Existing service credentials are not diagnostic tokens. [D4 evidence](AI_RUNTIME_CHECK.md); the later D5 real test above consumed one normal admission and one generation.

`GET /api/telemetry/tokens` returns counts, cumulative latency, and reported token totals by planner/search/quality, plus fixed per-tool call/failure/latency counters. Search and Quality report zero model tokens because they are deterministic. Planner token values are `null` until a provider reports usage; missing usage is not interpreted as free.

The route is uncached and requires `Authorization: Bearer <AI_TELEMETRY_API_KEY>`. The optional key must be at least 32 characters. If it is missing or invalid, the route fails closed (503/401). Never place it in a `NEXT_PUBLIC_` variable or browser request.

The app test suite runs ten mocked Orchestrator requests and verifies the endpoint's per-agent aggregate totals. This validates aggregation and authorization, not live provider billing or durable/cross-instance behavior.

Run `npm run verify:mcp:remote` with `MCP_INTERNAL_API_KEY` set in local `.env` or `.env.local` to exercise all five read-only tools through the server-only adapter. It logs only aggregate outcomes/timing and never calls Google. It refuses non-Render endpoints and explicitly sets its validated Render URL for the app client. Do not paste the secret into chat or command history.
