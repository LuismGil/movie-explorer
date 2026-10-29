# Deployment Checkpoint — 2026-10-29

## Deployed Services

| Service | Public URL | Role |
|---|---|---|
| Next.js / Vercel | `https://movie-explorer-luis.vercel.app` | Current movie UI; still uses server-side TMDB actions |
| MCP / Render Free | `https://movie-explorer-ppc2.onrender.com/mcp` | Authenticated Streamable HTTP tools; not a visitor-facing page |

The user reported completing both deployments and configuring Vercel with the MCP URL and the same `MCP_INTERNAL_API_KEY` generated in Render. Dashboard settings and secret values were not inspected. Never commit or share those values.

Expected Render settings: allow origin `https://movie-explorer-luis.vercel.app`, use the package as the Docker build context (`packages/mcp-server`), and bind to `0.0.0.0` on Render's assigned `PORT`. These were the deployment instructions; dashboard settings were not independently checked.

## Evidence and Limits

### First real AI execution — local handler, 2026-10-29

After explicit one-test authorization, the existing handler ran in a private local process against real Google/Upstash/Render. Shared admission allowed one attempt, countTokens and generateContent each returned 200 once, one MCP search ran, Quality approved 12 movies including the expected film, and the NDJSON consumer validated clean EOF. Usage: **214 input + 23 output = 237 tokens**; total **4,275ms**. No retries, public listener, source/env changes or public activation. This confirms the tested local composition, not the full generative Vercel/browser path or billing. [Complete evidence](AI_LIVE_CHECK.md).

### MCP

- Agent HTTP checks: `GET /health` → `200 {"status":"ok"}`; `GET /ready` → `200 {"status":"ready"}`.
- Agent authentication check: `POST /mcp` without credentials → `401 {"error":"Unauthorized"}`.
- Initial health sample (2026-10-23): four sequential `/health` requests returned 200 in 13,869 ms, 620 ms, 245 ms, and 237 ms; idle duration was unknown.
- Later controlled quiet-window samples (2026-10-29): after 16 minutes with no requests from our checks, `/health` returned 200 in 12,542 ms. After another 16-minute quiet window, an authenticated MCP initialize-only handshake returned successfully in 13,889 ms with no tools called. External traffic during either window could not be observed, so treat these as indicative, not definitive proof of platform idling.
- The authenticated local server-only adapter then completed all five read-only MCP tools via Render in 3,253 ms (52 movie summaries); no Google call occurred. The first attempt used localhost because local `MCP_SERVER_URL` was absent; the remote check now explicitly sets its validated Render endpoint before loading the app client.
- The observed 13.889-second handshake exceeded the prior 10-second initialization deadline. The local cap is now 20 seconds with the 30-second global orchestration and 35-second route/UI caps unchanged. This accommodates the measured sample with modest margin, but not Render's full documented ~1-minute possible wake-up; Free suitability remains unresolved.
- User reported successful **local** health/readiness, authentication, Inspector tool listing, and a real TMDB search.
- User-provided **remote** Inspector 1.0.3 output confirms authenticated `tools/list` with all five documented tools and `search_movies(query=Inception, page=1)` returning real TMDB data, including movie 27205 (`A Origem`), with no MCP error.
- **Verified locally:** authenticated Next.js server adapter execution through the same server-only MCP client/Search Agent; one fixed authenticated search was also verified from Vercel in D4. D5 separately tested one complete live AI invocation through the handler locally. This does not prove enabled Vercel/browser AI execution. Broader failure/reliability testing remains pending.
- Health/readiness do not test TMDB credentials or upstream availability.
- Render deployment success was reported by the user; build logs and image contents were not inspected. An earlier local Docker attempt was blocked by daemon permissions; a later local build/smoke succeeded as recorded below.
- Local MCP container verification (2026-10-23): `docker build -t movie-explorer-mcp:phase6-check ./packages/mcp-server` succeeded after the dependency updates. A container started with synthetic health-smoke credentials returned `/health` 200 and unauthenticated `POST /mcp` 401, then was stopped. The synthetic values were not production credentials and no TMDB/Google call was made.
- Free-tier idle wake-up behavior is sampled but may be affected by unobserved external traffic; load testing and production suitability remain unverified.

### Vercel

**Quota/privacy preparation deployed (2026-10-29):** `088ef9b` is pushed and the user confirms Ready. A subsequent production smoke returned Discover 200 with the expanded privacy disclosure and official terms link, startup hint hidden, and same-origin AI POST 503/disabled with `no-store, no-transform`. This checks the deployed disabled boundary only; no admission/Render/Google call occurs.

**Protected runtime check passed and route retired:** D4 operator output reports Upstash PING/isolated EVAL passed in **83ms**, authenticated MCP search in **928ms**, **1,015ms** total. A previous Upstash failure did not expose its precise cause; no confirmed quiet window was recorded. D4 itself called no Google or real admission counter. Retirement commit `e8b314c` is pushed and production diagnostic GET/POST both return **404**. Local lint/types/build, 349 remaining tests and compiled 404/disabled-AI smoke passed. Token/older-deployment cleanup remains operator-managed and unverified. Evidence: [`AI_RUNTIME_CHECK.md`](AI_RUNTIME_CHECK.md).

**Latest AI checkpoint (2026-10-29):** Commit `5419f86` is pushed and Vercel Ready is user-confirmed. The subsequent smoke returned `/discover` 200 with the startup hint hidden, and same-origin `POST /api/ai/search` 503 with only `error/disabled` and `no-store, no-transform`. This verifies the deployed disabled boundary, not Vercel→Upstash/Render/Google execution. No Google request occurred.

A headless Chromium smoke test verified:

- Home returns HTTP 200 and includes movie links in server-rendered HTML.
- Pagination advances to page 2.
- Daily and weekly trending views load.
- Typing `Inception` produces search results.
- Movie details render synopsis, cast, and similar-movie sections.
- Watchlist add/remove, navigation, and persistence across reload work functionally.
- No direct browser requests to the TMDB data API or MCP, or `api_key` query parameters, were observed in these flows. Poster/trailer provider traffic is expected.

**Resolved live finding:** a persisted watchlist caused React hydration error **#418** on a full page load. A clean browser context with an empty watchlist did not produce this error. The fix below is deployed and passes both the user's manual retest and agent live browser checks.

Original reproduction (before the fix):

1. Open the Vercel home page in a fresh browser context.
2. Save one movie using the watchlist heart button.
3. Open `/watchlist` through a full navigation or reload.
4. Observe React error #418 in the browser console; the saved movie still appears after recovery.

`src/context/WatchlistProvider.tsx` initialized from `localStorage` only in the browser, whereas SSR started with an empty list. A regression test confirmed that this caused the initial-render mismatch before the fix.

This smoke test is not a fresh axe/Lighthouse audit, a client-bundle secret audit, or end-to-end AI validation.

### Local Hydration Fix Verification — 2026-10-22

- The provider now exposes an empty watchlist during SSR/initial hydration using a `useSyncExternalStore` server snapshot, then reveals the lazily loaded browser state. Persistence waits for hydration so the empty snapshot cannot erase saved movies.
- The watchlist suite grew from 1 to 8 tests: saved client mounts, SSR without storage access, empty/persisted StrictMode hydration, preserved storage, add/remove, and malformed storage. The persisted-hydration test failed on the old provider and passes with the fix.
- `npm run lint`, `npm run typecheck`, all **22 app tests**, and `npm run build` pass.
- Browser checks against the local standalone production build on port 3100 passed search, pagination, daily/weekly trending, details, and watchlist save/remove/full navigation/reload. Saved state was preserved with **no page errors**, including no hydration recovery.
- Scoped Playwright/axe checks found **zero critical/serious violations** on Home and both saved/empty Watchlist. No direct browser TMDB data API/MCP requests or `api_key` query parameters were observed in the tested flows.
- The temporary verification server was stopped. The agent did not push/deploy; the user subsequently reported redeployment (see below). No fresh Lighthouse run, Docker rebuild, or MCP suite rerun was performed for this change.

### Vercel Production Retest — 2026-10-22

- The user confirmed that saved movies survive repeated reloads and that removal/reload works without console errors.
- Agent live Chromium checks passed Home HTTP 200/server-rendered movie links, pagination, daily/weekly trending, title search, movie details, saved-watchlist full navigation/two reloads, and removal followed by reload.
- No page errors (including React #418/hydration recovery), direct browser TMDB data API/MCP requests, or `api_key` query parameters were observed in those flows. Tests used isolated browser storage, not the user's session.
- **Phase 5 core-flow production verification is closed.** These checks do not approve Phase 6 architecture/models or verify the unused Next.js MCP adapter, authenticated Render tools, load tolerance, or a fresh production Lighthouse/security audit.

## Remote MCP Verification

Run in Bash. First wake/check the service:

```bash
curl --fail --max-time 120 https://movie-explorer-ppc2.onrender.com/health
curl --fail --max-time 120 https://movie-explorer-ppc2.onrender.com/ready
```

The commands below reproduce the user's successful **Inspector 1.0.3** test. This legacy release is deprecated and receives security fixes only; it is pinned here for reproducibility, not added as a project dependency. Upgrading the test client to v2 is separate work (v2 requires Node.js 22.19+); do not mix v2-only flags with the v1 client.

Run the next command unchanged. When it prompts, paste the Render secret and press Enter; nothing will appear while pasting. Do not substitute the key into the command or share it in chat:

```bash
read -rsp 'MCP_INTERNAL_API_KEY: ' MCP_KEY
```

Optionally verify only its length (at least 32 characters). A length of 0 means the variable is empty and will produce 401; a valid length alone does not prove the value is correct:

```bash
printf '\nCaracteres cargados: %s\n' "${#MCP_KEY}"
```

In that same terminal, copy each complete command, including `npx`:

```bash
npx --yes @modelcontextprotocol/inspector@1.0.3 --cli 'https://movie-explorer-ppc2.onrender.com/mcp' --transport http --method tools/list --header "Authorization: Bearer $MCP_KEY"
```

```bash
npx --yes @modelcontextprotocol/inspector@1.0.3 --cli 'https://movie-explorer-ppc2.onrender.com/mcp' --transport http --method tools/call --tool-name search_movies --tool-arg query=Inception --tool-arg page=1 --header "Authorization: Bearer $MCP_KEY"
```

Expect the five documented tools and a successful movie payload without `isError: true`. Inspector 1.0.3 needs the URL as a positional target and uses `--tool-arg`; the earlier `--server-url`/`--tool-args-json` examples failed with this client version before authentication. The deprecation warning is separate from the test result.

Do not publish headers, shell traces, or secrets; the expanded header may be visible to local process-monitoring tools while the command runs. Clear the temporary variable **after both tests**, not between them:

```bash
unset MCP_KEY
```

## Google Gemini Credential Setup

**Availability complete (2026-10-22):** The user confirmed all environment variables are now in Vercel **Production** and a redeploy succeeded. This includes correcting MCP variables that were previously Development-only and configuring `GOOGLE_GENERATIVE_AI_API_KEY`. A local presence-only check confirmed a non-placeholder Google value in root `.env`; no value was printed/transmitted. Provider authentication, account/model access, quotas, and billing tier were not verified. This is a **third, separate credential**, not the TMDB key or MCP Bearer secret. Model/no-alternate-fallback policy is now approved below; paid usage is not authorized.

Setup reference (already completed according to the evidence above):

1. Open [Google AI Studio → API keys](https://aistudio.google.com/api-keys), sign in, and accept the applicable terms. New users may already have a default project/key. Otherwise choose **Create API key** and follow the project/key dialog; create a dedicated Movie Explorer project if needed. Existing Google Cloud projects may need to be imported into AI Studio first.
2. Copy the Gemini API key privately. If AI Studio labels it unrestricted and offers **Restrict to Gemini API only**, apply that restriction. Start with the Free Tier if available for the account/model; do not enable paid billing without a separate cost decision. Free availability and quotas are not guaranteed for every model/account.
3. Add the following to **root `.env.local`**, preserving existing file contents. Replace only the placeholder to the right of `=` with the real Google key. If you already keep app secrets in root `.env`, you may add it there instead; avoid duplicate definitions of this key across files. Do not put it in `packages/mcp-server/.env` or Render:

   ```dotenv
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_generative_ai_api_key_here
   ```

4. In Vercel → **Project → Settings → Environment Variables**, add the exact name `GOOGLE_GENERATIVE_AI_API_KEY`, paste the key as the value, and mark it **Secret/Sensitive**. Select **Production** and, if needed, **Preview**. Keep the key in your own secret store because sensitive values may not be readable after saving. Never use a `NEXT_PUBLIC_` or `VITE_` prefix.
5. Restart the local dev server if running. Vercel environment changes apply to new deployments, so redeploy to apply the saved configuration. Only confirm that setup is complete; never send the value, a screenshot containing it, or an environment-file dump to chat/Git.

These steps prepare configuration only. The public `/discover` route remains deliberately disabled; adding a key alone does not enable generation. Search/Quality are deterministic and make no model calls. A successful redeploy alone does not prove Google access or Vercel runtime-to-MCP integration: one separately authorized local live test later confirmed Google access for that invocation, while full enabled Vercel/browser execution remains unverified.

References: [Gemini API keys](https://ai.google.dev/gemini-api/docs/api-key), [Google provider environment variable](https://ai-sdk.dev/providers/ai-sdk-providers/google), [Vercel environment variables](https://vercel.com/docs/environment-variables).

## Approved Model Policy

- **Explicit user approval (2026-10-22):** default `gemini-3.1-flash-lite`, no automatic switch to a second model, and controlled failures instead of paid escalation or unbounded retries. Google's model page labels it stable with structured outputs/function calling; published pricing lists Free Tier text input/output. Availability/quotas depend on the account/project and may change.
- **Runtime constraints:** schema/Quality validation must never be bypassed. Implemented 6.6 limits: one planner invocation, 4,096 input / 512 output / 4,608 total tokens with exact-request preflight, 5 tool slots, 30s global / 20s MCP init / 10s per-tool deadlines, no retries/fallback/continuations. The observed cold MCP handshake was 13.889s. Google planning is disabled until trusted server/operator approval; the flag is not a billing check or free-pricing guarantee. [Runtime contract](ORCHESTRATOR.md).
- **Cost/privacy condition:** do not enable billing or make live generative calls without confirming the project's Free Tier status. Model selection does not force free billing on a paid project. The published Free Tier table also allows submitted data to be used to improve Google's products; do not submit secrets/private data. Broader end-user privacy requirements must be reviewed before a public AI flow.
- Entry approval is complete. The single authorized local live test confirmed provider authentication/model access for that invocation, **not** billing status or a Vercel execution certification. Older alternative model labels/cost estimates are superseded by this policy, not current approval for other models.

**Review clarification (2026-10-29):** Google/model approval and the operator's acceptance of unpaid-service data use are recorded; no replacement is selected. The initial architecture approval did not close visitor age/audience and regional distribution conditions. The route now derives the trusted Google assertion from server-owned availability, which remains false. Close the remaining public distribution/release conditions and obtain activation approval; the successful local test is not full Vercel/browser certification. See the review, alternatives and exact release sequence in [`AI_DEMO_DECISION.md`](AI_DEMO_DECISION.md).

Sources checked on 2026-10-22: [model capabilities/status](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite), [Free Tier/pricing](https://ai.google.dev/gemini-api/docs/pricing).

## Next Work, in Order

**Latest progress (2026-10-29):** D3 wiring/disclosure, D4 Vercel dependency checks and one D5 real local-handler inference are verified. The diagnostic route is gone in production, and public AI stays disabled. Remaining work is operator cleanup, cold-start acceptance, visitor distribution/public activation decisions and a deliberately scoped full enabled Vercel/browser test.

1. **D4 remaining cleanup:** hosted route removal and local diagnostic-key absence are verified. Confirm Vercel key removal and handle older deployments only with approval for destructive operations. Preserve the successful sample; do not repeat the retired command.
2. **Cold-start acceptance:** agree on bounded demo behavior. The recorded quiet-window handshake was 13.889s; the latest successful runtime sample had no confirmed idle window. Neither guarantees every Render Free wake-up fits 20s.
3. **D1–D3 remaining release conditions:** keep Google/model, completed wiring/disclosure and existing Free/no-payment/eviction/privacy confirmations. Clarify only missing model/account/audience facts; do not reopen operator consent or invent an unapproved access restriction.
4. **D5 public release:** the single authorized real local inference has passed. Obtain public activation approval after applicable gates and explicitly scope the enabled Vercel/browser test with the existing global one/60s, ten/rolling-24h policy. The completed test does not authorize further inference, paid use, provider changes or Phase 7.

Earlier dependency checkpoint: root/MCP production audits were clear after same-major updates. Development advisories requiring Tailwind/Lighthouse major changes remain documented; this documentation review does not claim a fresh audit or silently schedule those major upgrades.

Official docs reviewed 2026-10-23: [Gemini quotas](https://ai.google.dev/gemini-api/docs/rate-limits) apply per project and actual RPM/TPM/RPD must be viewed in AI Studio; [billing status](https://ai.google.dev/gemini-api/docs/billing) belongs to the project/billing account, not the key. [Render Free](https://render.com/docs/free) sleeps after 15 minutes and may take about a minute to wake; local files disappear and Free Key Value state is lost on restart. Free compute alone does not prevent bandwidth/build overage charges if a payment method exists. Do not add payment details or keep-alive polling. [Upstash pricing](https://upstash.com/docs/redis/overall/pricing) lists a persistent Free plan with 500K commands/month and warns that adding a card upgrades it to pay-as-you-go. Limits are provider-published, not inspected account entitlements.

The existing Vercel movie pages do not invoke MCP or Search; 6.7 was deployed by the user on 2026-10-29 with public availability still false. Its public route makes no provider/agent calls. Do not add a public diagnostic endpoint or expose the shared secret to browser code just to test the connection.
