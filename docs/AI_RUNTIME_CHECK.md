# Temporary Protected Vercel Runtime Check — Evidence and Retirement

Status (2026-10-29): **hosted checks passed and the route is retired**. Removal commit `e8b314c` is pushed; credential-free production GET/POST to the diagnostic both return 404. A presence-only recheck confirms the dedicated key is absent from local `.env`; its value was not read. Vercel token removal and older-deployment handling are unverified. Public AI is disabled. D4 itself made no Google request; the subsequent separately authorized [D5 local live test](AI_LIVE_CHECK.md) passed without restoring this diagnostic.

## Hosted evidence

Source: output supplied by the operator running the fixed caller against `https://movie-explorer-luis.vercel.app`, following deployment of the diagnostic reporting fix `811d956` and environment corrections. This is operator-provided execution evidence, not an independent dashboard inspection or another agent-run authenticated probe.

```json
{"status":"passed","elapsedMs":1015,"checks":{"upstash":{"status":"passed","elapsedMs":83},"mcp":{"status":"passed","elapsedMs":928}}}
```

- **Vercel → Upstash:** PING and isolated-key atomic EVAL both passed in 83ms. The temporary key expired after five seconds; the real admission key was not read, changed or reset.
- **Vercel → Render/MCP → TMDB:** the authenticated fixed Inception search passed in 928ms with schema-valid, non-empty movie results.
- Total handler time: **1,015ms**. These are server-reported durations, not browser end-to-end latency.
- A preceding attempt returned Upstash failed/133ms and MCP passed/12,393ms (12,530ms total). The old aggregate response did not identify the Upstash failure stage/status; do not claim a specific authentication, HTTP or Lua cause from it.
- The operator reported different tokens, copied credentials from Upstash and redeployed. The final result closes the tested runtime paths; exact earlier erroneous values were not inspected. Quoted values are valid in local dotenv files, and removing all dotenv quotes was unnecessary.
- No confirmed idle window was recorded for these executions. Neither MCP duration certifies cold-start reliability or replaces the pending acceptance of bounded startup failures.
- Google/model access, the full generative pipeline, billing eligibility and public activation are not tested by this diagnostic.

## Historical scope and security

The now-retired local `POST /api/internal/runtime-check` required a **dedicated** server-only `AI_RUNTIME_CHECK_API_KEY` of 32–256 printable non-space ASCII characters. Missing/invalid configured secret returned 503 `operator_configuration_invalid`; missing/wrong Bearer authentication returned 401 before dependency work. Comparison was timing-safe, with no CORS access. Do not restore the route or reuse its token for another purpose.

The route accepted no query parameters or body and had no caller-selected target, script, movie, model or operation. Responses were `private, no-store` with `nosniff`, containing only aggregate statuses/times or fixed failure codes. Invalid dependency names were allowlisted and available only after successful authentication. Configuration values, raw errors and payloads were never returned or logged.

An authenticated, valid invocation performed only:

1. **Upstash:** one PING and one EVAL, sharing a two-second deadline and 1 KiB-per-response cap. The EVAL uses a new random `movie-explorer:diagnostic:runtime:<UUID>` key, sets one random non-user value with `NX` and a **five-second expiry**, then verifies it atomically. It never reads, writes or resets `movie-explorer:ai:admission:v1`. This checks REST authentication/EVAL capability, not the real production admission history or account billing.
2. **Render/MCP:** one fixed `search_movies(query=Inception, page=1)` through the existing server-only Search Agent/client, validating the result and requiring at least one movie. It uses the explicitly configured, exact HTTPS Render `/mcp` endpoint, Bearer authentication, existing 20s initialization bound and 10s tool bound, with one tool slot. No local/default/redirected/arbitrary MCP target is accepted.

The handler had a 30-second deadline (route maximum 35s), cancellation propagation and no retries. It never called Google planning/token counting or enabled the public pipeline. Diagnostic tool calls could contribute to existing aggregate tool telemetry, not planner usage.

The historical caller used a fixed production URL, rejected redirects, bounded replies to 1KiB/40s, validated all printed fields and never retried. Its package command has been removed; no further diagnostic run is needed for this successful sample.

## Earlier verification and investigation

- App lint/typecheck/build and **394 tests** pass (45 new diagnostic cases); five opt-in local Redis cases were skipped. These use mocks and make no hosted dependency/provider calls.
- Follow-up local reporting fix: lint/typecheck/build and **415 tests** pass (five opt-in Redis cases skipped). New cases cover stage-specific errors, names-only authenticated configuration reports and strict terminal-output allowlisting. A compiled production standalone smoke with synthetic secrets and outbound fetch disabled reproduced missing-token 503, configured-token unauthenticated 401, and authenticated invalid-dependency 503. Temporary servers were stopped; no hosted dependency was used in that smoke.
- Production investigation: one GET returned 405; one POST **without Authorization or a body** returned HTTP 503, exact JSON `{"error":"unavailable"}`, `private, no-store` and `nosniff`, with no `x-vercel-error` header, in 536ms. This matches the original handler's token guard before authentication/configuration/probes. Local token format validation passed without printing its value; this does not prove what the active Vercel deployment contains. No authenticated retry or request to Render/Upstash/Google was made during this investigation.
- A local production standalone smoke, using a synthetic diagnostic credential, returned 401 for missing/wrong tokens, 400 for a query override, and 405 for GET. Responses were no-store; the actual AI route remained 503/disabled. No authenticated dependency probe was run in that smoke, and its temporary server was stopped.
- The earlier production disabled-page smoke did not exercise dependencies; the operator-supplied successful runtime result above now covers the tested Vercel→Upstash/Render paths.
- A successful runtime check covers only that invocation; it does not certify all Render cold starts, Google/model access, the complete generative pipeline or distribution eligibility. Do not warm Render first if measuring a first request after a quiet window; record unobservable outside traffic honestly.

## Mandatory retirement after verification

- [x] Remove the diagnostic route, implementation/tests, caller/helper/tests, package script and example variable locally; preserve sanitized evidence here and in the plan/deployment docs. The additional local-only Upstash failure-detail experiment was removed with the diagnostic, never deployed.
- [x] Verify local retirement: lint/typecheck/build and **349 remaining tests** pass (five opt-in Redis cases skipped). A compiled standalone smoke with synthetic values and outbound fetch blocked returned 404 for diagnostic GET/POST and 503/disabled for public AI. Its temporary server was stopped. The test count drops because temporary diagnostic tests were retired with their implementation.
- [x] Publish retirement `e8b314c`; production diagnostic GET/POST both return 404.
- [x] Local cleanup: a presence-only check confirms `AI_RUNTIME_CHECK_API_KEY` is absent from `.env`; its value was not read, and the agent did not edit any private env file.
- [ ] Vercel cleanup: confirm removal of **only** `AI_RUNTIME_CHECK_API_KEY` from Vercel. Existing MCP, Upstash, Google and telemetry credentials are not diagnostic tokens and must remain intact.
- [x] Verify the hosted diagnostic route is gone (GET/POST 404); source public availability stays false and was not changed for the separate local live test. The public disabled-boundary HTTP smoke below was local, not a new hosted AI request.
- [ ] Address older diagnostic-containing deployments through the operator's controls, with explicit approval for destructive cleanup.

**Older immutable deployment URLs can retain their code and environment values.** Remove or protect diagnostic-containing deployments through the operator's Vercel controls as appropriate; deleting a token from settings alone does not prove older deployments stopped accepting it. This key must never be reused. Destructive deployment cleanup requires explicit operator approval. Do not leave the diagnostic deployed as a public test feature or add keep-alive monitoring.
