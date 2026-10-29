# Project Context

## Session: 2026-10-29 — Remote MCP and Render Free Wake Measurements

**Autorización:** User authorized authenticated Render/MCP verification. Vercel reported Ready after the shared-admission deployment; production `POST /api/ai/search` still returned the expected 503/disabled. No Google request occurred.
**Verificación remota:** Render `/health` and `/ready` returned 200 (12.874s and 0.755s; preceding idle unknown). An authenticated local server-only MCP adapter test completed all five read-only tools in 3,253ms (52 movie summaries). The initial attempt failed because local `MCP_SERVER_URL` was absent and the app defaulted to localhost; an explicit strict Render endpoint fixed this. `scripts/verify-mcp-remote.ts` now applies its validated Render endpoint to the app client. No tool results or credentials were logged.
**Quiet-window samples:** After 16 minutes with no requests from our checks, `/health` returned 200 in 12,542ms. After a later 16-minute quiet window, an authenticated MCP initialize-only handshake connected in 13,889ms; zero tools were called. External inbound traffic was not observable, so these are indicative, not certified no-traffic samples. The measured handshake exceeds the prior 10s initialization timeout.
**Change:** Increased only shared MCP initialization cap to 20s; retained 30s orchestrator, 35s route/UI, 10s per-tool, model token ceilings, and no automatic retries. Added a muted pt-BR notice explaining free-tier wake delay, only when AI search is enabled. Lint, typecheck, build, and 344 tests pass. This is a time limit, not a monetary/token budget; longer waits do not add provider calls but can occupy the function longer. The cap does not cover Render's full documented possible wake time, so AI remains disabled.
**Pendientes:** Confirm hosted Upstash plan/eviction and production runtime path, Vercel→Render behavior, Render cold-start suitability, and Google project Free/quota/privacy/live-test approvals. No Phase 7.

## Session: 2026-10-23 — Free-Only Shared AI Admission

**Autorización:** User reports all services are Free Tier and explicitly approved Upstash Redis Free without a card/paid plan, plus one global admission per 60 seconds and ten per rolling 24 hours. No new resource/account/credential was created or inspected; this is not provider billing/privacy/live-generation verification.
**Implementación:** `src/server/ai/rate-limit{,.script}.ts` uses one atomic Redis EVAL with the server clock and a fixed sorted-set key containing at most ten timestamps. No visitor/IP/cookie IDs, prompts, or movie results are sent. Failed/cancelled attempts consume admission; no refunds, auto-retry, namespace overrides, or local fallback. Strict HTTPS Upstash-only configuration, redirect rejection, 2s waiting/1KiB responses, sanitized errors, fail-closed 503, and 429/Retry-After/UI cooldown are implemented before any enabled public pipeline. Disabled/invalid traffic never calls the store; `aiDiscoveryEnabled` and Google activation remain false.
**Verificación:** App lint/types/build, 342 tests plus five separately run real Redis Docker cases, MCP verify/45 tests, local production axe on Home/Watchlist/Discover pass. Twelve independent handlers against the real Lua script yield one admission/eleven 429 responses. At 320px, disabled Discover has no page errors, failed resources, external requests or overflow; actual POST returns 503/disabled. Scoped client-chunk Upstash markers are absent. No new dependency, live Upstash/Google request, deployment, Lighthouse, or fresh app/MCP Docker build occurred for this change; the temporary Redis and app processes were stopped.
**Pendientes:** Operator provisions/configures the Free store without payment details, keeps eviction disabled, and verifies hosted admission. Actual Next.js→Render, confirmed Render idle wake, Google project/model Free status, end-user privacy and explicit live-test approval still block Phase 6/7 closure. Setup/sources: [`docs/AI_OPERATIONS.md`](../docs/AI_OPERATIONS.md), [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md).

## Session: 2026-10-23 — Phase 6.8 Implemented; Phase 6 Still Open

**Estado:** Added aggregate process-local telemetry for Planner/Search/Quality and the five MCP tools, plus an uncached `GET /api/telemetry/tokens` protected by optional server-only `AI_TELEMETRY_API_KEY`. No prompts, movie IDs, results, credentials, or raw exceptions are retained. Prompt/evidence/result caching remains disabled; only the MCP connection is reused. The public AI route and Google activation remain disabled.
**Seguridad:** Same-major updates moved Next.js 16.4.3, Axios 1.20.0, MCP SDK 1.32.2, and Zod 4.6.7 into patched ranges. Root and MCP production audits report zero vulnerabilities. Root dev audit retains 19 toolchain findings requiring Tailwind/Lighthouse changes; MCP retains one low dev-only `esbuild` advisory. No major upgrade was forced.
**Verificación:** App lint/typecheck/build and 286 tests pass; MCP lint/typecheck/build and 45 tests pass. Home/Watchlist/Discover production axe audit, MCP Docker build, health and unauthenticated 401 smoke pass. Render health sample: 13.869s, 620ms, 245ms, 237ms; initial idle duration was unknown, so cold start is unresolved.
**Pendientes que bloquean Phase 7:** Run `npm run verify:mcp:remote` with a locally configured `MCP_INTERNAL_API_KEY` (not available in this checkout), measure confirmed Render idle wake, review distributed abuse-rate limiting (no shared store approved), and confirm Google Free Tier/privacy/live-test gates. No live Google call or paid use was made. Full evidence: [`docs/AI_OPERATIONS.md`](../docs/AI_OPERATIONS.md), [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md).

## Session: 2026-10-22 — Validated Streaming UI 6.7 Implemented

**Estado:** After committing 6.6 as `eae2697`, continued into 6.7 at the user's request. `/discover`, leaf `AIChatPanel`, and bounded same-origin `POST /api/ai/search` now exist locally. No push/redeploy was performed. Existing movie pages/actions remain unchanged; navigation includes the new gated page.
**Contrato:** NDJSON contains only three ordered static progress stages and one Quality presentation/unsupported/allowlisted-error terminal. The handler revalidates the Orchestrator result and omits usage/plans/raw envelopes. The client validates incremental UTF-8, event order/shape, 2 MiB total bytes and clean EOF before returning presentation; unknown/truncated/trailing data never renders a partial-looking result. Request bytes are capped at 8 KiB with a 35s outer bound including body reading; cancellation and stale/unmount cleanup propagate.
**Fronteras:** Public DTO/text/event schemas live under `src/lib/ai`; existing Quality server exports remain compatible. Evidence/proposals/agents/provider/MCP/env stay server-only. UI copy is centralized pt-BR; scoped styles import shared tokens, with visible focus, reduced-motion-safe transitions, controlled live status and responsive stage layout. No HTML/Markdown rendering, persisted prompts, fake demo data, or new dependencies.
**Activación bloqueada:** `src/server/ai/availability.ts` deliberately exports false. The actual public route returns `503` plus only `error/disabled`, without invoking agents or reading Google keys; the form discloses unavailability and is disabled. The separate Google operator assertion is also off. Do not activate before eligibility/privacy/live-test approval, abuse/rate limits and dependency triage; a key or client flag cannot enable it. No Google/live MCP request, paid usage, environment change or secret exposure occurred.
**Pruebas:** All 281 app tests, lint/types/build and MCP verify/45 tests pass. The 68 new tests cover 24 stream reader/contract, 29 request/handler, and 15 UI cases; all 77 Quality regressions pass after schema extraction. Enabled data/stream states are mocked only.
**Navegador:** Local production standalone Chromium `/discover` HTTP 200; same-origin POST correctly returns disabled 503/no-store; desktop 1440px and mobile 320px axe report zero violations, no overflow/page errors/external requests, and visible keyboard outline. Initial browser run exposed Request.url normalization causing 403; Origin checking now uses actual Host and has a regression test, with forwarded-host spoofing rejected. Screenshots remain under `/tmp/opencode`; the temporary server was stopped. Targeted client-bundle markers show no Google endpoint/model or MCP runtime error strings, not a comprehensive secret/security audit.
**Pendientes:** 6.8 cache/rate limits/observability is next. Real Google/billing/privacy and Next.js→MCP/Render cold-start verification, dependency advisories, final TMDB-action migration and broader hardening remain pending. No fresh Docker/Lighthouse, enabled browser/live generation or production certification is claimed.
**Detalle:** [`docs/STREAMING_UI.md`](../docs/STREAMING_UI.md).

## Session: 2026-10-22 — Orchestrator 6.6 Implemented

**Estado:** 6.6 is implemented and tested locally with mocks. `runOrchestrator` validates requests/strict intent, compiles approved MCP plans, sequences Search→Quality, and returns only Quality-approved presentation or controlled statuses. The user requested committing this unit, then proceeding to 6.7.
**Archivos:** `src/server/agents/orchestrator{,.schemas,.plan}.ts`, `google-planner{,.fetch}.ts`, `src/server/runtime/abort.ts`, focused tests, and shared credential-reference validation. `ai@6.0.314` / `@ai-sdk/google@3.0.137` are exact SDK 6 dependencies; fixed model remains `gemini-3.1-flash-lite`.
**Presupuestos:** One planning invocation, no retries/fallback/SDK continuations, exact-wire-request `countTokens` preflight (4,096 input / 512 output / 4,608 total), 5 reserved MCP calls, 30s global deadline and 10s per-tool/init ceilings. IDs must match request context; title-based ID resolution returns validated choices rather than silently guessing. Unknown request/decision/DTO fields and raw prose cannot reach presentation.
**MCP:** Redirects rejected, concurrent initialization shared/bounded, cancelled waiters isolated, failed/disconnected singletons cleared for later requests. Search propagates SDK cancellation/timeouts and rechecks tool budget before initialization. This is scoped hardening, not a complete SDK security remediation or real transport verification.
**Activación:** Google is disabled without trusted server/operator `freeTierConfirmed: true`; request schemas cannot supply this flag/options/evidence/dependencies. This assertion does not check billing or force free pricing. Confirm account/model access, quotas, Free Tier eligibility, privacy conditions, and explicit live-test approval before activation. No Google or live MCP call, secret/environment change, public route/UI, or paid usage was performed.
**Verificación:** App lint/types/build and all 213 tests pass (67 Orchestrator, 32 real-SDK/mock-HTTP Google, 17 Search, 7 MCP-client, 77 Quality, 13 app/env/UI). MCP verify passes all checks/45 tests. No fresh browser/axe/Lighthouse/Docker checks. Runtime abort prevents downstream continuation but cannot guarantee accepted upstream work stops or consumes no quota.
**Seguridad pendiente:** Install audit: 59 findings (4 low/12 moderate/40 high/3 critical); production-only audit: 16 (5 moderate/9 high/2 critical), including Next.js/Axios/MCP SDK. All production-reported package names existed before; these three direct versions are unchanged. No broad audit fix attempted; triage/targeted remediation required before recommending deployment.
**Siguiente tarea:** 6.7 validated streaming UI, controlled progress/localized loading-error-empty-selection states, never raw model/MCP/prompt/Markdown streaming. Keep live Google activation gated; actual Next.js→MCP/Render cold starts and dependency remediation remain pending. Existing pages still use TMDB actions.
**Detalle:** [`docs/ORCHESTRATOR.md`](../docs/ORCHESTRATOR.md), [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md).

## Session: 2026-10-22 — Quality/Safety 6.5 Implemented

**Estado:** All 6.0 entry approvals are complete. The user explicitly approved `gemini-3.1-flash-lite`, no automatic alternate-model fallback, controlled provider/quota failures, and no paid usage. Phase 6.5 is implemented as a deterministic server-only gate, with no provider/network calls or UI/API integration.
**Archivos:** `src/server/agents/quality-agent.ts`, `quality-agent.schemas.ts`, `quality-agent.evidence.ts`, and `__tests__/quality-agent.test.ts`. Shared Search contracts moved to `search-agent.schemas.ts`; existing Search exports/behavior remain compatible and Quality does not import the MCP executor/client.
**Contrato:** `runQualityAgent(evidence, proposal)` checks trusted Search output and strict typed selections/claims, preserves TMDB IDs and movie-scoped metadata, rejects unsupported/contradictory facts, checks source status/count/ID consistency, and reconstructs an allowlisted plain-text DTO. Valid partial results survive. Unknown proposal/DTO keys and raw prose are rejected; known credential-like text/unsafe image paths cannot flow through as presentation data.
**Límites:** Evidence provenance must come from server-side Search, never a browser/model. Exact structured facts are checked, not arbitrary prose/toxicity or conflicts already lost in Search deduplication. Text is not safe for HTML/Markdown insertion; render escaped text nodes. No Google SDK, live provider calls, token usage, route, UI, or MCP contract changes were added. Billing/Free Tier account status and actual provider/Next.js-to-MCP integration remain unverified.
**Verificación:** App lint, typecheck, build, and all 99 tests pass, including 77 focused Quality/Safety cases and mocked Search→Quality integration. MCP lint/typecheck/build and 45 tests pass. No fresh browser/axe/Lighthouse, Docker, or live MCP/Google checks were run for this server-only feature.
**Siguiente tarea:** 6.6 Orchestrator — intent planning, tool selection, Search→Quality sequencing, runtime timeout/tool/token budgets, and controlled provider failures. Confirm Google account/model access, Free Tier billing eligibility, and privacy conditions before live generation. No paid usage is authorized.
**Detalle:** [`docs/QUALITY_GATE.md`](../docs/QUALITY_GATE.md), [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md#approved-model-policy).

## Previous Readiness Checkpoint: 2026-10-22 — Credentials Configured

**Estado:** Phase 5 core-flow verification, remote Inspector listing/search, current architecture/contracts, and credential availability are complete. The user confirmed all variables are now scoped to Vercel Production and that redeployment succeeded. Non-placeholder Google key presence was checked in root `.env` without showing its value or sending it to a provider. Only model/default/fallback policy remains an open 6.0 entry gate.
**Aprobación:** Transport/boundary/authentication, current five tool contracts, and current Phase 6 architecture are approved as of 2026-10-22. Model identifiers, fallback policy, costs/paid usage, and future contract changes are not included.
**Configuración Google/Vercel:** Root `.env.example` uses canonical `GOOGLE_GENERATIVE_AI_API_KEY`; the real key is present in the user's root `.env`. The user corrected MCP variables that had been Development-only, added the Google variable to Production, and redeployed. No dashboard values were inspected, and provider authentication/quota/billing tier were not tested. Keep secrets out of chat/Git/browser code and do not add the Google key to Render. The current runtime still does not consume the Google key.
**Propuesta pendiente:** Stable `gemini-3.1-flash-lite`, documented with Free Tier text input/output and structured-output/function-calling support. No automatic switch to another model; return controlled errors on quota/provider failure. Account eligibility, quotas, and billing tier must be checked before live generative tests; paid usage is not authorized. No runtime model setting or provider call has been added. Sources/limits are in `docs/DEPLOYMENT.md`.
**Cambio:** `src/context/WatchlistProvider.tsx` uses a `useSyncExternalStore` hydration snapshot to expose the same empty list during SSR and initial hydration, then exposes the lazily loaded browser state. Persistence waits for hydration and never writes the temporary empty snapshot over saved movies. Context API and UI copy/styles are unchanged.
**Pruebas:** `src/context/__tests__/WatchlistContext.test.tsx` now has 8 tests covering add/remove, saved client mounts, SSR without storage, empty/persisted hydration under StrictMode, storage preservation, and malformed storage. The persisted-hydration regression failed before the fix and passed afterward.
**Verificación local:** lint, typecheck, all 22 app tests, and production build pass. A standalone production server on port 3100 passed browser smoke for search, pagination, daily/weekly trending, details, watchlist save/remove, full navigation, and reload with no page errors or direct browser TMDB data API/MCP traffic. Axe found no critical/serious violations on Home and empty/saved Watchlist. The temporary server was stopped after verification.
**Verificación Vercel:** Agent live smoke passed Home HTTP 200/SSR links, pagination, daily/weekly trending, title search, movie details, saved-watchlist full navigation/repeated reloads, and removal followed by reload. No page errors, direct browser TMDB data API/MCP requests, or `api_key` query parameters were observed. Browser storage was isolated from the user's session.
**MCP remoto:** The user's Inspector 1.0.3 `tools/list` output contains all five documented tools. `search_movies` with `query=Inception` and `page=1` returned JSON text content including TMDB movie 27205 (`A Origem`), with no MCP error. This verifies the tested client→Render→TMDB path, not the unused Next.js adapter. Earlier health checks saw a transient 503 followed by 200; cold-start cause/duration/reliability remain unverified.
**Compatibilidad CLI:** Inspector 1.0.3 requires a positional URL and `--tool-arg`; the earlier `--server-url`/`--tool-args-json` instructions did not work with that version. An empty local `MCP_KEY` then caused 401; entering the Render secret locally resolved it. No secret value was shared. The deployment guide now records the exact successful legacy commands and their deprecation caveat.
**Límites:** This follow-up changes documentation only; no secrets were modified or exposed, no model was approved/activated, and no runtime/dependencies/agents changed. No fresh unit-suite, Docker, Lighthouse, or provider authentication/generation test was performed.
**Siguiente acción:** Ask for explicit model/default/fallback approval, then proceed with 6.5 Quality/Safety once the entry gate is closed. Confirm the Google project's Free Tier status before any live generation. Actual Next.js-to-MCP and Google-provider integration remain unverified.

## Earlier Checkpoint: 2026-10-22 — Deployment Verification

**Estado:** Next.js is deployed to `https://movie-explorer-luis.vercel.app`; standalone MCP is deployed to Render Free at `https://movie-explorer-ppc2.onrender.com/mcp`. The user reported configuring the shared Render-generated secret and MCP URL in Vercel and redeploying; dashboard values were not inspected.
**Evidencia MCP:** Agent checks confirm `/health` → 200/ok, `/ready` → 200/ready, and unauthenticated `POST /mcp` → 401. Local Inspector tool listing and real TMDB search passed according to the user. Remote authenticated tool execution and actual Next.js-to-Render execution are still unconfirmed.
**Evidencia Vercel:** Browser smoke passed Home/SSR, search, pagination, daily/weekly trending, movie details, and functional watchlist add/remove/persistence. No direct browser TMDB data API/MCP requests or `api_key` query parameters were observed in these flows.
**Bloqueo reproducido:** Save a movie, then fully navigate/reload `/watchlist`: React hydration error #418 occurs before recovery. Empty storage does not reproduce it. Suspected source: browser-only `localStorage` initialization in `src/context/WatchlistProvider.tsx` differs from the server's empty initial state. Phase 5 production verification remains open.
**Alcance:** Documentation/evidence update only; no runtime, UI, dependencies, credentials, or AI model selections changed. Public health checks do not validate TMDB credentials. No fresh a11y/Lighthouse or client-bundle secret audit was run.
**Siguiente acción:** Add a hydration regression test, fix initialization, redeploy, and repeat production checks. Confirm remote MCP tool execution and review the remaining 6.0 approvals before implementing 6.5 Quality/Safety.
**Detalle:** [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md). Free-tier wake-up latency remains unverified. No public MCP diagnostic endpoint or browser access should be added.

## Previous Implementation Checkpoint: 2026-10-05
**Estado:** Phase 6.4 Search Agent implemented as a deterministic MCP tool executor.
**Archivos principales:** `src/server/agents/search-agent.ts` and `src/server/agents/__tests__/search-agent.test.ts`.
**Comportamiento:** Validates orchestrator-supplied tool plans and MCP responses with Zod; calls only `src/server/mcp/client.ts`; aggregates and deduplicates movies/details/credits by TMDB ID; rejects mismatched IDs; retains successful results on partial failure and returns sanitized per-call status.
**Límites intencionales:** No LLM/provider/model, intent classification, direct TMDB access, UI rendering, global token budget, or production integration was added.
**Verificación local en ese checkpoint:** root lint, typecheck, production build, and 15 tests passed; MCP lint, typecheck, build, and 45 tests passed. The local Docker build could not access the daemon (`/var/run/docker.sock` permission denied). See the 2026-10-22 checkpoint above for subsequent deployment evidence; no image inspection or local Docker rerun has been recorded.
**Gates pendientes:** Phase 5 production verification and remaining Phase 6.0 approvals (AI credentials/models, tool contracts, and final architecture approval). Hosting selected: Render Free; its idle spin-down/cold start must be evaluated before production use.
**Siguiente tarea de agentes:** Phase 6.5 — Quality/Safety Agent, after production verification and unresolved approval gates are closed.

## Completed Phases
- **Phase 1: Stabilization & Code Quality** (Completed on 2026-06-03)
  - Extracted UI components from `Home/index.tsx` into standalone modular components: [SearchBar.tsx](src/components/SearchBar.tsx), [MovieGrid.tsx](src/components/MovieGrid.tsx), and [PaginationBar.tsx](src/components/PaginationBar.tsx).
  - Split `WatchlistContext.tsx` into [WatchlistContext.ts](src/context/WatchlistContext.ts) and [WatchlistProvider.tsx](src/context/WatchlistProvider.tsx) to resolve `react-refresh/only-export-components` violations.
  - Replaced eager `localStorage` state reading in [WatchlistProvider.tsx](src/context/WatchlistProvider.tsx) with a lazy state initializer to avoid SSR hydration mismatches.
  - Fixed Hook placement order violation in [MovieDetailsPage (index.tsx)](src/pages/MovieDetails/index.tsx).
  - Resolved all `@typescript-eslint/no-unused-vars` catch-block variable warnings.
  - Added typecheck script to [package.json](package.json).

- **Phase 2: Accessibility Baseline (WCAG 2.1 AA)** (Completed on 2026-06-08)
  - Refactored [MovieCard.tsx](src/components/MovieCard.tsx) to separate the watchlist `<button>` and `<Link>` wrapper into sibling elements under a relative container, eliminating nested interactive controls.
  - Added focus-visible states (`focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none`) to all interactive elements to support visible focus rings.
  - Added `aria-hidden="true"` to decorative emoji in [Header.tsx](src/components/Header.tsx).
  - Implemented `aria-current="page"` dynamically on navigation links in [Header.tsx](src/components/Header.tsx) using `useLocation`.
  - Added associated hidden label `<label htmlFor="movie-search">` to the input in [SearchBar.tsx](src/components/SearchBar.tsx).
  - Added target page number to pagination button labels (`aria-label={`Go to page ${page}`}`) in [PaginationBar.tsx](src/components/PaginationBar.tsx).
  - Set `role="status"` and `aria-live="polite"` with visually-hidden loader text in [LoadingSpinner.tsx](src/components/LoadingSpinner.tsx).
  - Set language to `pt-BR` in [index.html](index.html).
  - Implemented a "Skip to Main Content" link in [App.tsx](src/App.tsx) targeting `<main id="main-content" tabIndex={-1}>`.
  - Set `aria-pressed` on all watchlist toggle buttons across [MovieCard.tsx](src/components/MovieCard.tsx) and [MovieDetailsPage (index.tsx)](src/pages/MovieDetails/index.tsx).
  - Integrated development-only browser-based accessibility auditing using `@axe-core/react` in [main.tsx](src/main.tsx).
  - Resolved SecureCoder's medium i18n portability finding in [PaginationBar.tsx](src/components/PaginationBar.tsx) using a local label constants object to satisfy the scanner. Full internationalization (`i18next`) architecture was intentionally deferred to a future phase as it is out of scope for the Phase 2 accessibility baseline.

- **Phase 3: Security Baseline** (Completed on 2026-06-08)
  - Moved all client-side TMDB API consumption to a local backend API proxy to completely hide the API key from the browser bundle.

- **Phase 4: DevOps Baseline** (Completed on 2026-06-09)
  - Updated Express server [tmdb-proxy.ts](server/tmdb-proxy.ts) to serve static client assets from `dist` and handle SPA routing in production mode.
  - Updated package scripts in [package.json](package.json) to support client/server builds and local production runs (`npm run build`, `npm run start`).
  - Added new dev dependencies: `playwright`, `@axe-core/playwright`, and `@lhci/cli`.
  - Created [Dockerfile](Dockerfile) using a 3-stage setup: alpine-based dependency install (`base`), client/server compilation and dependency pruning (`builder`), and a minimal debian12 distroless runtime (`runner`).
  - Created [.dockerignore](.dockerignore) to prevent copying local development artifacts into the image.
  - Created [scripts/a11y-audit.js](scripts/a11y-audit.js) using Playwright + axe-core to perform headless checks on the Home and Watchlist pages.
  - Configured Lighthouse CI in [lighthouserc.json](lighthouserc.json) with custom budgets: LCP warning threshold at `1.2s`, CLS error threshold at `0.05`, and accessibility minimum score at `0.95`, mapped to the local Express server.
  - Configured GitHub Actions CI pipeline in [.github/workflows/ci.yml](.github/workflows/ci.yml) to run lint, typecheck, unit tests, build, Playwright-based a11y checks, Lighthouse budget verification, and a Docker build smoke test.
  - Updated [.gitignore](.gitignore) to exclude local server build output (`dist-server/`) and Lighthouse reports (`.lighthouseci/`).
  - Docker build and runtime were verified locally with `docker build -t movie-explorer:latest .` and `docker run --rm -p 3000:3000 -e TMDB_API_KEY=<runtime-secret> movie-explorer:latest`.
  - The container serves the Vite production build and the `/api/tmdb/...` server-side proxy on port `3000`.
  - No `VITE_TMDB_API_KEY` is required by the Docker runtime.

- **Phase 5: Next.js App Router Migration** (Completed on 2026-06-13)
  - Migrated the application from Vite SPA to Next.js App Router.
  - Implemented async Server Components for data-heavy pages: `app/page.tsx` (Home) and `app/movie/[id]/page.tsx` (Movie Details).
  - Implemented Server Actions in `src/server/actions/tmdb.ts` to fetch movies server-side without direct REST/HTTP endpoints exposed to client or browser.
  - Converted watchlist to dynamic Next.js client component page (`app/watchlist/page.tsx`) referencing `localStorage` via context provider.
  - Isolated client components with `"use client"` leaf boundaries: `Header`, `MovieCard`, `SearchBar`, `PaginationBar`, `WatchlistToggle`.
  - Removed Vite runtime (`vite.config.ts`, `index.html`), legacy Express proxy (`server/tmdb-proxy.ts`), and unused custom hooks/files.
  - Configured `output: 'standalone'` in `next.config.ts` for optimized Docker building.
  - Updated `Dockerfile` to copy standalone build artifacts into distroless Node environment.
  - Addressed touch target, heading order, and image CLS issues to achieve perfect Lighthouse audits.
  - Remediated the internationalization security warning by extracting the skip-navigation link (`app/layout.tsx`) and header navigation texts (`src/components/Header.tsx`) into translation mapping objects.

- **Phase 5 Post-Migration Cleanups** (Completed on 2026-06-13)
  - **Tailwind Docker CSS Fix**: Resolved production CSS breakage in the Docker container caused by Tailwind purging utility classes used in the App Router pages. Fixed by adding `./app/**/*` and `./src/**/*` to the content path in [tailwind.config.js](tailwind.config.js).
  - **Centralized i18n/Message Layer**: Resolved all SecureCoder JSX internationalization warnings by moving hardcoded pt-BR static strings, accessible labels, and placeholders to a centralized dictionary at [messages.ts](src/i18n/messages.ts) and [index.ts](src/i18n/index.ts).
  - **Import Alias Convention**: Adopted `@/*` path alias mapping to `./src/*` as configured in [tsconfig.json](tsconfig.json). Normalized all cross-folder relative imports (e.g., `../...` or `../../../...`) within `src/` and `app/` to use the `@/` alias convention.
  - **TypeScript Test Folder Path Alias Resolution**: Fixed path alias resolution within `__tests__` directories by removing test folder exclusions from the `exclude` block in [tsconfig.json](tsconfig.json), ensuring that `@/` imports resolve correctly in editors.
  - **Documentation Sync**: Consolidated duplicated Phase 5 tracking headers across [.ai/TASK.md](.ai/TASK.md) and [.ai/PLAN.md](.ai/PLAN.md). All post-migration cleanup items are now nested under a single "Post-Migration Cleanups" heading inside the existing Phase 5 section. No runtime feature work was performed.
  - **Verification**: Verified that all checks pass successfully, including: `npm run lint`, `npm run typecheck`, `npm run test -- --run` (3/3 pass), `npm run build`, and Playwright/axe-core accessibility audits (`npm run test:a11y`). Scanned codebase to ensure no deep relative imports or un-localized JSX strings remain.

## Current Status

App/MCP lint/types/tests/build were rerun for 6.7, with scoped disabled-discovery standalone Chromium/axe checks. Other browser/axe/Lighthouse/Docker entries below describe earlier verification, not production AI certification.

- **Active Work**: Phase 6 — MCP Server + Multi-Agent System.
  - 6.1 foundation, 6.2 MCP tools, 6.3 adapter, 6.4 deterministic Search, 6.5 deterministic Quality/Safety, 6.6 Orchestrator and 6.7 validated UI/stream boundary are implemented.
  - Orchestrator compiles strict plans and sequences Search→Quality with time/tool/token budgets. `/discover` and its public NDJSON handler remain disabled, as does real Google planning; production activation/integration remain unverified.
  - Vercel/Render, Phase 5 core-flow verification, remote Inspector listing/search, and 6.0 entry approvals are complete. Actual Next.js/provider integration and billing eligibility remain unverified.
- **ESLint**: 0 warnings, 0 errors (via `npm run lint`).
- **TypeScript**: 0 compiler errors (via `npm run typecheck`).
- **Tests**: All 281 app tests pass, including 68 stream/handler/UI, 67 Orchestrator, 32 Google-adapter, 77 Quality/Safety, 17 Search, 7 MCP-client, and 8 watchlist tests; all 45 MCP tests pass.
- **A11y**: Latest scoped Playwright/axe run against local production on port 3100 found 0 critical/serious violations on Home and empty/saved Watchlist. The hardcoded-port `npm run test:a11y` script was not used in this run.
- **Lighthouse**: Assertions validated via Lighthouse CI local runs (`npx lhci autorun`). All budgets for Performance, Accessibility, and CLS met.
- **Docker**: Standalone multi-stage Distroless configuration. CSS asset serving fixed via Tailwind content path correction.
- **Security**: No `NEXT_PUBLIC_` API keys, all TMDB fetching isolated server-side.
- **i18n**: 100% compliant with SecureCoder JSX i18n portability checks; no hardcoded user-facing strings, labels, placeholders or titles exist.
- **Phase 6.0: Architecture and Entry Gates** (Complete)
  - The user approved current architecture/contracts and model/no-alternate-fallback policy, and confirmed Production configuration/redeployment. Local Google key presence is verified without revealing its value. No paid usage is authorized; provider/billing remain unverified. See `docs/DEPLOYMENT.md`.
  - **Current State versus Target State**: Currently, Next.js owns the existing server-side TMDB integration. The target state introduces an isolated, standalone Node.js MCP server (`packages/mcp-server/`) accessed via a Streamable HTTP transport and Bearer authentication, and a 3-agent orchestration pipeline.
  - **Current architecture/contracts (approved)**:
    - Transport: Streamable HTTP exclusively.
    - Boundaries: `packages/mcp-server` for MCP; Vercel for Next.js app; Container-based service for MCP.
    - Agents: Orchestrator, Search, and Quality/Safety.
    - Tools: `search_movies`, `get_movie_details`, `get_recommendations`, `get_trending`, `get_credits`.
    - Validation: Zod schemas at all boundaries.
    - Strict stream rules (no raw output).
  - **Selected MCP hosting**: Render Free, with health/readiness and unauthenticated-request rejection verified by the agent and authenticated listing/search verified through user-provided Inspector output. Idle wake-up latency and production suitability remain unverified.
  - **Remaining verification, not entry approval**: Google access/Free Tier billing eligibility, actual Next.js-to-MCP/provider integration, privacy conditions before public generation, and Render cold-start hardening. Approvals and credential presence do not certify these behaviors.

## 6. Recent Changes

* **Architecture Alignment:** Formalized Phase 6 and Phase 7 roadmap for Multi-Agent & Standalone MCP architecture.
* **MCP Server Foundation:** Built the standalone `packages/mcp-server` with Streamable HTTP transport, Zod environment validation, constant-time bearer authentication, strict origin validation, vitest unit/integration tests, tsup builds, independent ESLint/TSConfig setup, and a separate Dockerfile. Integrated into the root CI workflow via `mcp-gate` job.
  - **Files Changed**: `.ai/ARCHITECTURE.md`, `.ai/MCP_INTERFACE.md`, `.ai/SECURITY.md`, `.ai/SPEC.md`, `.ai/PLAN.md`, `.ai/TASK.md`, `.ai/CONTEXT.md`.
  - **Confirmation**: No package, runtime, UI, or configuration code/dependencies were changed.
* **Search Agent 6.4:** Added a server-only deterministic executor for validated MCP plans, with output schemas, stable ID-based merging, partial failures, and sanitized outcomes. No AI provider or direct TMDB access was added.
  - **Exact Next Step**: 6.5 is now implemented; proceed with 6.6 Orchestrator while enforcing the approved no-alternate-fallback/no-paid-usage constraints and the Search→Quality presentation boundary.
* **Deployment Checkpoint 2026-10-22:** Recorded the user-reported Vercel/Render deployments, verified public health/auth rejection and browser flows, and reproduced the persisted-watchlist hydration error. No runtime changes or new approvals were inferred.
* **Watchlist Hydration Fix 2026-10-22:** Added the failing SSR/hydration regression, corrected the provider's initial visible snapshot/persistence timing, and verified the fix with unit tests, local production browser smoke, and scoped axe checks. The user subsequently redeployed and confirmed success; agent live browser retesting also passed, closing Phase 5 core-flow verification.
* **Remote MCP Smoke 2026-10-22:** User-provided Inspector output confirms all five remote tools and a successful `Inception` search returning movie 27205. Corrected the guide to the tested positional-URL/`--tool-arg` syntax for Inspector 1.0.3; its deprecation and remaining integration/approval limits are explicit.
* **Architecture Approval / Google Setup 2026-10-22:** Recorded explicit approval of current architecture/contracts and the user's lack of a Google API key. Aligned the root environment template with `GOOGLE_GENERATIVE_AI_API_KEY` and documented secure setup; no credential or model was selected/configured by the agent.
* **Credential Availability 2026-10-22:** User confirmed corrected Vercel Production scope and successful redeployment. Checked non-placeholder Google key presence in root `.env` without printing/sending its value. Recorded `gemini-3.1-flash-lite`/no automatic model fallback as a proposal only; model approval, provider access, and billing eligibility are not established.
* **Quality/Safety 6.5 / Model Approval 2026-10-22:** The user subsequently approved the model/no-alternate-fallback policy. Added the deterministic gate, shared Search schemas, strict DTOs, bounded evidence/claims, plain-text/path checks, and 77 tests. All 99 app and 45 MCP tests/lint/types/build pass. Orchestrator/provider/UI integration is still pending; no live provider request or paid usage occurred.
