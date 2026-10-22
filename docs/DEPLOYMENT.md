# Deployment Checkpoint — 2026-10-22

## Deployed Services

| Service | Public URL | Role |
|---|---|---|
| Next.js / Vercel | `https://movie-explorer-luis.vercel.app` | Current movie UI; still uses server-side TMDB actions |
| MCP / Render Free | `https://movie-explorer-ppc2.onrender.com/mcp` | Authenticated Streamable HTTP tools; not a visitor-facing page |

The user reported completing both deployments and configuring Vercel with the MCP URL and the same `MCP_INTERNAL_API_KEY` generated in Render. Dashboard settings and secret values were not inspected. Never commit or share those values.

Expected Render settings: allow origin `https://movie-explorer-luis.vercel.app`, use the package as the Docker build context (`packages/mcp-server`), and bind to `0.0.0.0` on Render's assigned `PORT`. These were the deployment instructions; dashboard settings were not independently checked.

## Evidence and Limits

### MCP

- Agent HTTP checks: `GET /health` → `200 {"status":"ok"}`; `GET /ready` → `200 {"status":"ready"}`.
- Agent authentication check: `POST /mcp` without credentials → `401 {"error":"Unauthorized"}`.
- During the latest availability check, the first `/health` request returned 503; subsequent `/health` and `/ready` requests returned 200 with the expected JSON. The cause and wake-up duration were not established. Health success after recovery is not a cold-start/reliability certification.
- User reported successful **local** health/readiness, authentication, Inspector tool listing, and a real TMDB search.
- User-provided **remote** Inspector 1.0.3 output confirms authenticated `tools/list` with all five documented tools and `search_movies(query=Inception, page=1)` returning real TMDB data, including movie 27205 (`A Origem`), with no MCP error.
- **Pending:** actual Next.js-to-Render execution, authenticated calls to the other four tools, and broader failure/reliability testing. Listing tools does not exercise every tool, and Inspector success does not prove Vercel integration.
- Health/readiness do not test TMDB credentials or upstream availability.
- Render deployment success was reported by the user; build logs and image contents were not inspected. The previous local Docker build attempt was blocked by daemon permissions.
- Free-tier idle wake-up latency, load testing, and production suitability remain unverified.

### Vercel

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

**Availability complete (2026-10-22):** The user confirmed all environment variables are now in Vercel **Production** and a redeploy succeeded. This includes correcting MCP variables that were previously Development-only and configuring `GOOGLE_GENERATIVE_AI_API_KEY`. A local presence-only check confirmed a non-placeholder Google value in root `.env`; no value was printed/transmitted. Provider authentication, account/model access, quotas, and billing tier were not verified. This is a **third, separate credential**, not the TMDB key or MCP Bearer secret. Model/default/fallback policy and paid usage are not approved yet.

Setup reference (already completed according to the evidence above):

1. Open [Google AI Studio → API keys](https://aistudio.google.com/api-keys), sign in, and accept the applicable terms. New users may already have a default project/key. Otherwise choose **Create API key** and follow the project/key dialog; create a dedicated Movie Explorer project if needed. Existing Google Cloud projects may need to be imported into AI Studio first.
2. Copy the Gemini API key privately. If AI Studio labels it unrestricted and offers **Restrict to Gemini API only**, apply that restriction. Start with the Free Tier if available for the account/model; do not enable paid billing without a separate cost decision. Free availability and quotas are not guaranteed for every model/account.
3. Add the following to **root `.env.local`**, preserving existing file contents. Replace only the placeholder to the right of `=` with the real Google key. If you already keep app secrets in root `.env`, you may add it there instead; avoid duplicate definitions of this key across files. Do not put it in `packages/mcp-server/.env` or Render:

   ```dotenv
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_generative_ai_api_key_here
   ```

4. In Vercel → **Project → Settings → Environment Variables**, add the exact name `GOOGLE_GENERATIVE_AI_API_KEY`, paste the key as the value, and mark it **Secret/Sensitive**. Select **Production** and, if needed, **Preview**. Keep the key in your own secret store because sensitive values may not be readable after saving. Never use a `NEXT_PUBLIC_` or `VITE_` prefix.
5. Restart the local dev server if running. Vercel environment changes apply to new deployments, so redeploy to apply the saved configuration. Only confirm that setup is complete; never send the value, a screenshot containing it, or an environment-file dump to chat/Git.

These steps prepare configuration only. The Google provider is not wired into the runtime, no model has been approved/activated, and adding the key alone does not enable AI/chat. Credential availability is complete; explicit model/default/fallback policy approval remains open. The successful redeploy does not prove a Google or Next.js-to-MCP call works.

References: [Gemini API keys](https://ai.google.dev/gemini-api/docs/api-key), [Google provider environment variable](https://ai-sdk.dev/providers/ai-sdk-providers/google), [Vercel environment variables](https://vercel.com/docs/environment-variables).

## Proposed Model Policy — Awaiting Approval

- **Candidate default:** `gemini-3.1-flash-lite`. Google's current model page labels it stable and supports structured outputs/function calling; the published pricing page lists Free Tier text input/output. Availability and quotas depend on the user's account/project and may change.
- **Fallback proposal:** no automatic switch to a second model. On quota/provider failure, return a controlled failure instead of escalating to paid models or retrying without limits. Existing schema/Quality validation must never be bypassed. Detailed timeout/tool/token enforcement remains part of the planned Orchestrator work.
- **Cost/privacy condition:** do not enable billing or make live generative calls without confirming the project's Free Tier status. Model selection does not force free billing on a paid project. The published Free Tier table also allows submitted data to be used to improve Google's products; do not submit secrets/private data. Broader end-user privacy requirements must be reviewed before a public AI flow.
- This is a **proposal only**, not a runtime setting or user approval. No provider authentication/generation test has been run. Model labels/cost estimates elsewhere in older roadmap notes are not evidence that those identifiers or budgets are approved/current.

Sources checked on 2026-10-22: [model capabilities/status](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite), [Free Tier/pricing](https://ai.google.dev/gemini-api/docs/pricing).

## Next Work, in Order

1. Explicitly approve model/default/fallback policy in [the execution plan](../.ai/PLAN.md). Architecture/contracts and credential availability are complete; no model or paid usage has been approved. Confirm account/billing eligibility before any live generative test.
2. Implement **6.5 Quality/Safety** after entry-gate approval: factual grounding in Search Agent results, rejection of unsupported/contradictory claims, sanitization, and a validated presentation DTO. No raw model output may reach the UI.
3. Verify the actual Next.js-to-MCP path as integration proceeds; retain the remaining remote-tool and free-tier reliability checks for hardening.

The current Vercel pages do not invoke MCP or the Search Agent. Do not add a public diagnostic endpoint or expose the shared secret to browser code just to test the connection.
