# Phase 6 — MCP Server + Multi-Agent System

## Active Phase
- Phase 6.5 Quality/Safety is implemented and verified; all 6.0 entry approvals are complete, including the explicit `gemini-3.1-flash-lite`/no-alternate-fallback policy.
- Phase 5 production verification is closed: the deployed hydration fix passes user and agent live browser checks without React errors.
- Next agent task: 6.6 Orchestrator (intent planning, sequencing, and runtime budgets). No live Google calls or UI wiring were added in 6.5.

## Previous Completed Phases
- [x] Phase 1 — Stabilization & Code Quality
- [x] Phase 2 — Accessibility Baseline (WCAG 2.1 AA)
- [x] Phase 3 — Security Baseline
- [x] Phase 4 — DevOps Baseline
- [x] Phase 5 — Next.js App Router Migration and core-flow production verification (2026-10-22)

## Current Goal
- Continue with 6.6 while preserving the implemented Search→Quality contracts and strict presentation gate. The approved model policy does not authorize paid usage; Google account/Free Tier eligibility must be confirmed before live generation. Actual provider/Next.js-to-MCP integration remains unverified.

## Tasks

- [x] Confirm Next.js App Router is approved as the target framework before implementation.
- [x] Install and configure Next.js.
- [x] Update package.json scripts:
  - dev → next dev
  - build → next build
  - start → next start
  - keep lint, typecheck, test, and test:a11y.
- [x] Create app/layout.tsx with:
  - `<html lang="pt-BR">`
  - skip navigation link
  - shared Header
  - `<main id="main-content">`.
- [x] Create app/page.tsx as the Home route.
- [x] Create app/movie/[id]/page.tsx as the Movie Details route.
- [x] Create app/watchlist/page.tsx as the Watchlist route.
- [x] Use React Server Components by default for data-heavy pages.
- [x] Add "use client" only where required:
  - Watchlist provider/state
  - localStorage access
  - event handlers
  - interactive search if still client-side.
- [x] Create a server-only TMDB layer:
  - src/server/tmdb.ts or src/server/actions/tmdb.ts
  - use process.env.TMDB_API_KEY
  - no VITE_ env variables
  - no client-side TMDB key exposure.
- [x] Replace the temporary Express/Vite TMDB proxy when Next.js server-side access is ready.
- [x] Remove or retire Vite-specific files only after Next.js works:
  - index.html
  - vite.config.ts
  - Vite-specific scripts/config.
- [x] Preserve Phase 2 accessibility fixes:
  - no nested interactive elements
  - focus-visible rings
  - labels
  - aria-current
  - aria-pressed
  - decorative aria-hidden
  - loading states with role="status"
  - skip navigation.
- [x] Preserve Watchlist behavior with localStorage.
- [x] Preserve Home search/trending behavior.
- [x] Preserve Movie Details page behavior:
  - details
  - trailer
  - credits/cast
  - recommendations/similar movies.
- [x] Update Dockerfile for Next.js production runtime.
- [x] Update .dockerignore if needed.
- [x] Update GitHub Actions CI if needed.
- [x] Update Lighthouse CI config if needed.
- [x] Update Playwright/axe a11y audit script if routes or startup commands change.
- [x] Update README only with what is actually implemented.
- [x] Update .ai/CONTEXT.md with Phase 5 start status.
- [x] Internationalize layout JSX elements (skip-navigation link, header texts) to address SecureCoder findings.

### Post-Migration Cleanups

- [x] Fixed Tailwind production purge by adding `./app/**/*` to `tailwind.config.js`.
- [x] Centralized static UI copy in `src/i18n/messages.ts` and `src/i18n/index.ts`.
- [x] Replaced hardcoded JSX strings and accessible labels with centralized messages.
- [x] Verified SecureCoder i18n warnings for static JSX copy.
- [x] Verified TypeScript path alias imports using `@/* -> ./src/*`.
- [x] Synchronized `.ai/TASK.md`, `.ai/PLAN.md`, `.ai/CONTEXT.md`, and `docs/ANATOMY.md`.

### Production Verification

- [x] Record the user-reported Vercel deployment at `https://movie-explorer-luis.vercel.app`.
- [x] Browser smoke: Home/SSR, search, daily/weekly trending, movie details, pagination, watchlist add/remove/persistence; no direct browser TMDB data API/MCP requests or `api_key` query parameters observed.
- [x] Add an SSR/hydration regression test and fix React error #418 when reloading a persisted watchlist.
- [x] Local verification: lint, typecheck, 22 tests, production build; browser smoke without page errors; axe with no critical/serious violations on Home and empty/saved Watchlist.
- [x] Redeploy and repeat production checks without hydration errors: user confirmation and agent live browser smoke passed core flows with no page errors.

Details and evidence: [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md). Phase 5 production verification is closed for the tested core flows; remote MCP/AI integration remains separate.

## Verification Checklist

```bash
npm run lint
npm run typecheck
npm run test -- --run
npm run build
npm run test:a11y
```

### Security Verification
```bash
grep -R "VITE_TMDB_API_KEY\|import.meta.env\|api.themoviedb.org" -n src app server .env.example package.json next.config.* --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next --exclude-dir=dist
```

### Docker Verification
```bash
docker build -t movie-explorer:latest .
docker run --rm -p 3000:3000 -e TMDB_API_KEY=<runtime-secret> movie-explorer:latest
```

# Phase 6 — MCP Server + Multi-Agent System

**Status:** In Progress
**Goal:** Introduce a standalone MCP server for TMDB and a validated three-agent AI orchestration flow without exposing secrets or rendering raw LLM output.

## Architecture and Entry Gates

- [x] Phase 5 production deployment verified: user-confirmed watchlist retest and agent live core-flow smoke without React errors.
- [x] Streamable HTTP approved as the only MCP transport.
- [x] `packages/mcp-server` approved as the standalone server boundary.
- [x] Vercel approved as the Next.js deployment boundary.
- [x] Standalone MCP hosting provider selected: Render Free; evaluate free-tier cold starts before production use.
- [x] Bearer authentication using `MCP_INTERNAL_API_KEY` approved.
- [x] `GOOGLE_GENERATIVE_AI_API_KEY` available locally/in Vercel: non-placeholder presence checked in root `.env`; user confirmed Production scope and successful redeploy. No credential value or provider request was exposed/sent.
- [x] Default model/no-alternate-fallback policy explicitly approved: `gemini-3.1-flash-lite`, controlled failures, no paid usage authorized.
- [x] Current five MCP tool contracts reviewed and approved.
- [x] Current Phase 6 architecture reviewed and approved; model/default/fallback policy approved separately.

Explicit user approvals recorded on 2026-10-22, including the default model/no-alternate-fallback policy. No paid usage or future MCP contract changes are authorized. Actual billing eligibility and provider access must be verified before live generation. No secret values belong in chat or Git.

### Deployment Checkpoint — 2026-10-22

- [x] Record user-reported MCP deployment to Render Free: `https://movie-explorer-ppc2.onrender.com/mcp`.
- [x] Agent checks: `/health` and `/ready` return 200; unauthenticated `POST /mcp` returns 401.
- [x] Record user-reported local Inspector tool listing/TMDB search success and Vercel MCP environment configuration/redeployment; no secret values inspected.
- [x] Record corrected Vercel environment scope and redeploy: MCP variables are now in Production, not only Development; Google Production configuration is also user-confirmed.
- [x] Confirm authenticated remote tools via user-provided Inspector 1.0.3 output: all five tools listed; `search_movies(query=Inception, page=1)` returned real TMDB data including movie 27205 without an MCP error.
- [ ] Verify Next.js-to-Render MCP execution; the current UI does not invoke the MCP adapter.
- [ ] Evaluate free-tier cold starts against request timeouts.

#### Standalone MCP Server Foundation
**Status**: `Complete`

* **Goal**: Establish the standalone `packages/mcp-server` Node.js HTTP runtime, independent of Next.js.
* **Scope**:
  * Set up `packages/mcp-server/` with independent build (`tsup`), tests (`vitest`), and linting.
  * Implement the Streamable HTTP transport and basic Express lifecycle.
  * Implement robust environment validation with Zod (stripping `.env` from the root).
  * Implement the internal authentication middleware (`Authorization: Bearer <MCP_INTERNAL_API_KEY>`).
  * Implement health/readiness endpoints for deployment health checks.
  * Add the standalone `Dockerfile`.
  * Add isolated CI checks for `mcp-server`.
* **Out of Scope**: Real TMDB tools, Next.js client implementation, agents.

## 6.2 TMDB MCP Tools

- [x] Implement `search_movies`.
- [x] Implement `get_movie_details`.
- [x] Implement `get_recommendations`.
- [x] Implement `get_trending`.
- [x] Implement `get_credits`.
- [x] Define Zod input/output schemas for every tool.
- [x] Prevent secrets from appearing in logs or tool responses.

## 6.3 Server-only MCP Client

- [x] Build Next.js server-only MCP client adapter.
- [x] Integrate Bearer authentication.

## 6.4 Search Agent

- [x] Execute MCP tool calls via the server-only MCP Client.
- [x] Validate and normalize results; deduplicate by TMDB movie ID.
- [x] Preserve IDs and scoped details/credits; reject mismatched IDs.
- [x] Keep successful tool data when another call fails and sanitize failure metadata.
- [x] Ensure the Search Agent calls only MCP and receives its tool plan as input.

**Implementation boundary:** `src/server/agents/search-agent.ts` remains a deterministic MCP executor, not an LLM planner or user-facing agent. Its schemas are shared with Quality/Safety without importing network modules into the quality gate. Entry approvals are complete; current pages still use existing TMDB actions.

## 6.5 Quality/Safety Agent

- [x] Validate typed factual claims against trusted Search Agent/MCP-derived data and preserve TMDB IDs.
- [x] Reject unsupported/contradictory claims, inconsistent source status/IDs, and conflicting available metadata.
- [x] Rebuild strict, bounded, plain-text presentation DTOs; preserve valid partial results and sanitize public issue codes.
- [x] Reject arbitrary model prose/unknown proposal keys; never forward raw model/MCP envelopes or errors as presentation data.
- [x] Add 77 focused tests, including mocked Search→Quality integration and no-network execution; all 99 app tests and 45 MCP tests pass, along with lint/types/build for both packages.

See [`docs/QUALITY_GATE.md`](../docs/QUALITY_GATE.md). This is a deterministic structured-fact gate, not an LLM judge or general HTML sanitizer. No public entry point or UI consumes it yet.

## 6.6 Orchestrator Agent

- [x] Classify strict intents and deterministically compile approved MCP tools; disallow invented IDs and require selection when resolving named titles.
- [x] Sequence Planner→Search→Quality using server-only evidence and return only Quality-approved presentation DTOs.
- [x] Enforce 30s global / 10s per-tool deadlines, 5 tool slots, 1 planner invocation, and 4,096 input / 512 output / 4,608 total tokens; no retries/fallback.
- [x] Add pinned AI SDK 6 Google adapter, actual-wire-request token preflight, controlled errors, and disabled-by-default operator Free Tier activation gate. No live generation authorized/performed.
- [x] Harden shared MCP initialization, redirect rejection, cancellation, and reconnect-on-later-request behavior.
- [x] Verify 213 app tests (67 Orchestrator, 32 Google-adapter HTTP mocks), lint/types/build, and all MCP checks/45 tests.

Contract/limits: [`docs/ORCHESTRATOR.md`](../docs/ORCHESTRATOR.md). No public route/UI is connected. Live provider/billing/privacy and actual Next.js→MCP/Render cold-start verification remain pending.

## 6.7 Validated Streaming UI

- [ ] Stream only validated progress and structured data.
- [ ] Add loading, error, and empty states.
- [ ] Prevent streaming of private prompts, chain-of-thought, or unvalidated Markdown.

## 6.8 Cache, Limits, and Observability

- [ ] Define caching strategies without leaking user data.
- [ ] Record tool latency and token usage.

## 6.9 Hardening and Phase Closure

- [ ] Triage/fix dependency advisories before recommending deployment; root production audit currently reports 16 findings, including 2 critical. Do not apply broad automatic major upgrades.
- [ ] Verify unit, integration, and accessibility tests pass.
- [ ] Verify standalone Docker container build for MCP server.
- [ ] Update final documentation.
