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
- User reported successful **local** health/readiness, authentication, Inspector tool listing, and a real TMDB search.
- **Pending:** authenticated tool listing/search against Render, and actual Next.js-to-Render execution. Local success does not prove remote credentials or Vercel integration.
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

**Original live finding:** a persisted watchlist caused React hydration error **#418** on a full page load. The UI recovered, but production verification was not complete. A clean browser context with an empty watchlist did not produce this error. The fix below is verified locally; Vercel redeployment/retest is still pending.

Reproduction:

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
- The temporary verification server was stopped. No push/deployment, fresh Lighthouse run, Docker rebuild, or MCP suite rerun was performed for this change.
- **Still pending:** deploy this revision to Vercel and repeat the original reload reproduction and core flows before closing Phase 5 production verification.

## Remote MCP Verification

Run in Bash. First wake/check the service:

```bash
curl --fail --max-time 120 https://movie-explorer-ppc2.onrender.com/health
curl --fail --max-time 120 https://movie-explorer-ppc2.onrender.com/ready
```

Enter the Render secret locally, without putting its literal value in shell history or chat:

```bash
read -rsp 'MCP_INTERNAL_API_KEY: ' MCP_KEY
printf '\n'
```

```bash
npx --yes @modelcontextprotocol/inspector --cli \
  --transport streamable-http \
  --server-url 'https://movie-explorer-ppc2.onrender.com/mcp' \
  --header "Authorization: Bearer $MCP_KEY" \
  --method tools/list
```

```bash
npx --yes @modelcontextprotocol/inspector --cli \
  --transport streamable-http \
  --server-url 'https://movie-explorer-ppc2.onrender.com/mcp' \
  --header "Authorization: Bearer $MCP_KEY" \
  --method tools/call \
  --tool-name search_movies \
  --tool-args-json '{"query":"Inception","page":1}'
```

Expect the five documented tools and a successful movie payload without `isError: true`. Do not publish headers, shell traces, or secrets; the expanded header may be visible to local process-monitoring tools while the command runs. Clear the temporary variable afterward:

```bash
unset MCP_KEY
```

## Next Work, in Order

1. Push/deploy the locally verified hydration fix to Vercel, confirm the deployed revision, and repeat saved-watchlist reload and core-flow checks with no React hydration errors.
2. Confirm remote authenticated MCP tool execution and record the result, without secrets.
3. Review the remaining Phase 6.0 gates in [the execution plan](../.ai/PLAN.md): transport/boundaries/authentication, Google credential availability, model policy, MCP contracts, and final architecture approval. Deployment evidence does not automatically approve these gates.
4. Implement **6.5 Quality/Safety** after entry-gate approval: factual grounding in Search Agent results, rejection of unsupported/contradictory claims, sanitization, and a validated presentation DTO. No raw model output may reach the UI.

The current Vercel pages do not invoke MCP or the Search Agent. Do not add a public diagnostic endpoint or expose the shared secret to browser code just to test the connection.
