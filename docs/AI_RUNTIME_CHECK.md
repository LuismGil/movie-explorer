# Temporary Protected Vercel Runtime Check

Status (2026-10-29): operator confirms deployment, but caller attempts return generic HTTP 503. A credential-free production POST returned the original handler's exact `unavailable` response before authentication, isolating the current failure to a missing/invalid **deployed operator token**, not an Upstash/Render failure. Successful hosted dependency checks remain pending. More precise reporting is prepared locally, not deployed. Public AI generation remains disabled. This is an operator diagnostic, not a visitor login.

## Fixed scope and security

`POST /api/internal/runtime-check` requires a **new, dedicated** server-only `AI_RUNTIME_CHECK_API_KEY` of 32–256 printable non-space ASCII characters. Do not reuse MCP, Google, Upstash or telemetry credentials. Missing/invalid configured secret returns 503 `operator_configuration_invalid`; missing/wrong Bearer authentication returns 401 before dependency work. Comparison is timing-safe. No CORS access is granted.

The route accepts no query parameters or body and has no caller-selected target, script, movie, model or operation. All responses are `private, no-store` with `nosniff`. Responses contain aggregate pass/fail/not-run statuses and elapsed milliseconds, or fixed failure codes. **Only after successful operator authentication**, invalid dependency configuration returns 503 `configuration_invalid` with field names from a fixed four-variable allowlist. Raw configuration values, Zod issues, tool payloads, prompts, credentials and errors are never returned or logged by the diagnostic.

An authenticated, valid invocation performs only:

1. **Upstash:** one PING and one EVAL, sharing a two-second deadline and 1 KiB-per-response cap. The EVAL uses a new random `movie-explorer:diagnostic:runtime:<UUID>` key, sets one random non-user value with `NX` and a **five-second expiry**, then verifies it atomically. It never reads, writes or resets `movie-explorer:ai:admission:v1`. This checks REST authentication/EVAL capability, not the real production admission history or account billing.
2. **Render/MCP:** one fixed `search_movies(query=Inception, page=1)` through the existing server-only Search Agent/client, validating the result and requiring at least one movie. It uses the explicitly configured, exact HTTPS Render `/mcp` endpoint, Bearer authentication, existing 20s initialization bound and 10s tool bound, with one tool slot. No local/default/redirected/arbitrary MCP target is accepted.

The whole handler stops waiting after 30 seconds (route maximum 35s) and propagates cancellation. Failures produce HTTP 503 plus aggregate results, with no retries. The two checks report independently where time/cancellation permits. It never imports or calls the Google planner, invokes token counting, or enables the public pipeline. Diagnostic tool calls can contribute to the existing aggregate tool telemetry, not planner usage.

## Private operator setup

1. Generate a **new private token** in your own terminal/password manager. For example, run `openssl rand -hex 32` locally. Its output is a secret: never paste it into chat, Git, a URL, a screenshot or a browser console.
2. Save it privately in root `.env` **or** `.env.local`, preserving existing settings and avoiding duplicate definitions:

   ```dotenv
   AI_RUNTIME_CHECK_API_KEY="YOUR_NEW_PRIVATE_TOKEN"
   ```

3. Save the same value as server-only **Vercel Production** `AI_RUNTIME_CHECK_API_KEY`, marked Sensitive where available. Dotenv quotes are allowed locally; paste only the token into Vercel, without quotes, spaces or newlines. Do not use a `NEXT_PUBLIC_`/`VITE_` prefix or add it to Render. No new paid resource, plan or payment method is needed.
4. Existing Vercel Production variables must include `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `MCP_INTERNAL_API_KEY` and exactly `MCP_SERVER_URL=https://movie-explorer-ppc2.onrender.com/mcp`. Do not paste their values or change billing. The local caller needs only the diagnostic token; dependency operations execute inside Vercel.
5. Commit/push the diagnostic and deploy after saving the new environment variable. Changes to Vercel variables apply to new deployments. Confirm the new deployment is the current **Production** deployment serving `movie-explorer-luis.vercel.app`, not just a Ready preview or an older immutable URL. Keep `aiDiscoveryEnabled=false`.
6. When the deployment is Ready, run **once** from the local project:

   ```bash
   npm run verify:ai:runtime
   ```

The script reads local env privately, posts only to the fixed production Vercel URL, rejects redirects, caps responses at 1 KiB and waits at most 40s. Its `ai-runtime-response.ts` helper validates aggregate results and fixed failure codes/variable names before logging. Unknown JSON, extra fields and platform HTML are never echoed. It exits nonzero on failure and never logs a raw response or a token. There is no automatic retry or polling. Report only the sanitized result/that the configuration is complete; never share the key.

Expected success: HTTP 200, `status: passed`, and both `checks.upstash.status` and `checks.mcp.status` equal `passed`.

- HTTP 503 `operator_configuration_invalid`: the active deployment's diagnostic token is missing/invalid; no dependency work ran.
- HTTP 401 `unauthorized`: authentication was rejected; no dependency work ran. Check the local/deployed token match privately.
- HTTP 503 `configuration_invalid`: authentication passed, but the named dependency variables are missing/invalid; no dependency work ran. Names do not disclose or verify credential values.
- HTTP 503 with aggregate check results: a dependency probe failed/timed out. Review the sanitized results before changing settings or retrying.
- The original deployed version uses `unavailable` for both token and dependency validation. An **unauthenticated** POST returning that exact code instead of 401 isolates the first/token guard. Unknown platform errors are not proof of an invalid variable.

Do not retry a failed probe without reviewing the result first. Repeated blind redeploys, changing unrelated credentials or upgrading dependencies are not diagnosis.

## Verification evidence and limits

- App lint/typecheck/build and **394 tests** pass (45 new diagnostic cases); five opt-in local Redis cases were skipped. These use mocks and make no hosted dependency/provider calls.
- Follow-up local reporting fix: lint/typecheck/build and **415 tests** pass (five opt-in Redis cases skipped). New cases cover stage-specific errors, names-only authenticated configuration reports and strict terminal-output allowlisting. A compiled production standalone smoke with synthetic secrets and outbound fetch disabled reproduced missing-token 503, configured-token unauthenticated 401, and authenticated invalid-dependency 503. Temporary servers were stopped; no hosted dependency was used in that smoke.
- Production investigation: one GET returned 405; one POST **without Authorization or a body** returned HTTP 503, exact JSON `{"error":"unavailable"}`, `private, no-store` and `nosniff`, with no `x-vercel-error` header, in 536ms. This matches the original handler's token guard before authentication/configuration/probes. Local token format validation passed without printing its value; this does not prove what the active Vercel deployment contains. No authenticated retry or request to Render/Upstash/Google was made during this investigation.
- A local production standalone smoke, using a synthetic diagnostic credential, returned 401 for missing/wrong tokens, 400 for a query override, and 405 for GET. Responses were no-store; the actual AI route remained 503/disabled. No authenticated dependency probe was run in that smoke, and its temporary server was stopped.
- The latest production disabled-page smoke passed before this diagnostic was added. It does not verify Vercel→Upstash/Render. Hosted runtime evidence remains pending until the configured deployment is checked.
- A successful runtime check covers only that invocation; it does not certify all Render cold starts, Google/model access, the complete generative pipeline or distribution eligibility. Do not warm Render first if measuring a first request after a quiet window; record unobservable outside traffic honestly.

## Mandatory retirement after verification

Remove the diagnostic route, its implementation/tests, caller script, response-report helper/tests, package script and example configuration; preserve the sanitized evidence in the plan/deployment docs. Remove the dedicated token from local env and Vercel, without changing other credentials, then redeploy and verify the route is gone (404/405) and AI remains in its intended state.

**Older immutable deployment URLs can retain their code and environment values.** Remove or protect diagnostic-containing deployments through the operator's Vercel controls as appropriate; deleting a token from settings alone does not prove older deployments stopped accepting it. This key must never be reused. Destructive deployment cleanup requires explicit operator approval. Do not leave the diagnostic deployed as a public test feature or add keep-alive monitoring.
