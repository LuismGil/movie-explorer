# Phase 6 — MCP Server + Multi-Agent System

## Active Phase
- **D5 single real test passed:** explicit operator authorization consumed by one private local-handler run against real Google/Upstash/Render. One shared admission, one token preflight and one generation (HTTP 200), one movie search; Quality approved 12 results including Inception and clean-EOF streaming passed. **237 tokens**, **4,275ms**. No source/env changes, retries, public activation or further inference authorization. [Evidence](../docs/AI_LIVE_CHECK.md).
- **D4 runtime passed:** operator output confirms Vercel→Upstash PING/isolated EVAL 83ms and Vercel→Render/MCP search 928ms, 1,015ms total, after deployment/configuration corrections. No Google or real-counter access. Cold-start reliability is not certified by this sample. Evidence: [`AI_RUNTIME_CHECK.md`](../docs/AI_RUNTIME_CHECK.md).
- **D4 route retired:** `e8b314c` is pushed and production diagnostic GET/POST return 404. Last full checks: 349 tests/lint/types/build and compiled local 404/disabled-AI smoke. A presence-only recheck confirms `AI_RUNTIME_CHECK_API_KEY` is absent from local `.env`; Vercel and older-deployment cleanup remain unverified. No token value was read; the agent has not edited private env files.
- **Latest UX decision:** direct public demo access, no invitations/accounts/link-request flow. Shared quota denial has a real countdown and catalog access; expiry permits manual retry, not a reserved slot. User approved an AI-only EEA/CH/UK/unknown-country block; the catalog remains worldwide. Public AI is still disabled; adult-audience, cold-start and Vercel verification gates remain open. Current local checks: 369 tests, lint/types/build pass; five opt-in Redis tests skipped.
- **Decision/execution (2026-10-29):** operator in Brazil accepts Google unpaid-service data use; one authorized real test passed. Keep Google/model, public availability false, and do not repeat the single consumed test. Remaining: audience/access, cold-start acceptance and deliberately scoped public/Vercel release verification.
- Phase 6.1–6.8 implementations exist; 6.9 release verification remains open. Google/model approval, operator privacy acceptance, the AI-only regional block and one separately authorized local live test are complete. Adult-audience eligibility, cold-start acceptance and public activation/full Vercel/browser execution remain pending.
- Phase 5 production verification is closed: the deployed hydration fix passes user and agent live browser checks without React errors.
- Public AI remains deliberately disabled. Next: bounded-startup and public-release decisions, then explicitly scoped enabled Vercel/browser verification; do not repeat the completed local live test automatically.

## Previous Completed Phases
- [x] Phase 1 — Stabilization & Code Quality
- [x] Phase 2 — Accessibility Baseline (WCAG 2.1 AA)
- [x] Phase 3 — Security Baseline
- [x] Phase 4 — DevOps Baseline
- [x] Phase 5 — Next.js App Router Migration and core-flow production verification (2026-10-22)

## Current Goal
- Complete a usable, honestly disclosed real-AI portfolio demo using the approved architecture where eligible. Preserve Search→Quality and conservative limits. Operator privacy acceptance, production-composition mocks, D4 hosted dependency checks and one separately authorized real local inference are complete. Resolve visitor eligibility and bounded startup, then deliberately scope public activation/full Vercel verification. No paid use, implicit consent, repeated inference or automatic provider/model switch.

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

## Active next work — 2026-10-29

The goal is a usable portfolio demo with real inference, not permanent disabled availability. Google/model approval remains valid; operator in Brazil now accepts unpaid-service data use. Source of truth: the D1–D5 sequence in [PLAN.md](PLAN.md) and [AI demo decision](../docs/AI_DEMO_DECISION.md).

- [x] Record deployment of `5419f86`: user confirmed Vercel Ready; post-deploy smoke passed `/discover` 200 and AI 503 `disabled`/`no-store`; startup hint hidden. No Vercel→MCP/Upstash/provider execution was exercised.
- [x] Record operator Free/no-payment confirmation for existing services and Upstash eviction disabled; isolated hosted checks passed locally, not in Vercel.
- [x] Record AI Studio values as user-reported usage/limits: 60 RPM, 100K input TPM, 100 RPD, all showing zero use; exact model/project access not independently verified.
- [x] Review original/execution plans and Google terms; distinguish approved architecture/model from unresolved release conditions. Find stale task summaries and unfinished production Google-assertion wiring; no live provider failure has been observed.
- [x] Document alternatives as contingencies only. Presets do not remove Google policy/eligibility constraints or silently replace free-text scope.
- [x] **D1 operator decision:** Brazil/LatAm confirmed; Google unpaid-service data policy accepted; proceed with approved provider/model.
- [ ] **D1 visitor audience:** clarify intended visitor regions/adult audience and access; a Brazil operator and demo label do not establish visitor eligibility.
- [ ] **D2:** Reuse current Google implementation and confirmed Free/no-payment setup; clarify only missing model/account/audience facts and the minimal eligible release design.
- [x] **D3 implementation:** wire trusted Google assertion from server-owned availability (false) and expand pt-BR disclosure with terms link.
- [x] **D3 verification:** production-composition mocks and existing suite pass (348 tests; five opt-in Redis cases skipped), along with lint/types/build; no live provider calls.
- [x] **D3 quota UX:** real countdown in hours/minutes/seconds, absolute expiry/tab-resume synchronization, non-live timer for accessibility, expiry message, catalog link and no automatic requests. Updated total: 349 passing tests, five opt-in Redis cases skipped; lint/types/build pass.
- [x] **D4 method/preparation:** user approved the temporary token-protected method; implement fixed-target, bounded/sanitized probes and caller. Verify lint/types/build, 394 tests and local production auth/override/disabled-AI smoke with no hosted calls.
- [x] **D4 execution:** operator-supplied output confirms both checks passed: Upstash 83ms, MCP 928ms, total 1,015ms; no Google or real admission-counter access.
- [x] **D4 local retirement:** remove temporary diagnostic/caller/helper/tests/command/example key. Lint/types/build, 349 remaining tests and local production route-removal/disabled-AI smoke pass.
- [x] **D4 hosted route retirement:** `e8b314c` pushed and production diagnostic GET/POST both return 404.
- [ ] **D4 remaining cleanup/acceptance:** confirm operator token/old-deployment handling and explicitly accept bounded cold-start behavior.
- [x] **D5 one authorized local live test:** real handler/admission/Google/Search/Quality/stream execution passed with one admitted generation, 237 tokens and 12 approved movies. No retry or public activation. [Evidence](../docs/AI_LIVE_CHECK.md).
- [ ] **D5 public release:** resolve remaining audience/startup decisions, obtain activation approval and scope enabled Vercel/browser verification. Retain 1 global admission/60s, 10/rolling 24h; no Phase 7 yet.

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
- [x] Verify the local Next.js server adapter against Render: all five read-only tools passed; this does not prove Vercel runtime access.
- [x] Verify the fixed Vercel-to-Render search with the approved protected method (operator output, 2026-10-29).
- [ ] Agree on the remaining cold-start limitation; successful samples have no confirmed idle window.

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

- [x] Stream only allowlisted stage codes and revalidated Quality presentation DTOs via a bounded same-origin NDJSON handler.
- [x] Add localized disabled/loading/partial/error/empty/unsupported/cancel/retry/movie-selection states at `/discover`.
- [x] Reject malformed UTF-8, oversized/truncated/trailing/out-of-order data; wait for clean EOF before showing results and discard cancelled/stale responses.
- [x] Share public DTO schemas only; prevent raw prompts/thoughts/provider text, MCP envelopes, usage/private errors or Markdown/HTML rendering.
- [x] Keep server availability false and Google activation disabled pending eligibility/privacy/abuse/security gates; no live generation or fake demo results.
- [x] Verify 281 app tests, app/MCP lint/types/build and 45 MCP tests; scoped local production Chromium/axe desktop/mobile checks pass with zero violations, overflow or page errors.

Contract/limits: [`docs/STREAMING_UI.md`](../docs/STREAMING_UI.md). Enabled data flows are mocked only; no live provider/MCP, production redeploy, Docker or Lighthouse run was performed for 6.7.

## 6.8 Cache, Limits, and Observability

- [x] Define caching strategies without leaking user data: no prompt/evidence/result caching; reuse only the server-side MCP connection; AI responses are `no-store`.
- [x] Record fixed-cardinality agent/tool latency, failures, and reported planner token usage in process-local aggregate metrics only.
- [x] Add operator-protected, uncached `/api/telemetry/tokens`; fail closed without `AI_TELEMETRY_API_KEY`; document process/serverless scope.
- [x] Record user approval (2026-10-23): Upstash Redis Free, no payment method/paid plan, one global admission per 60 seconds and ten per rolling 24 hours; no visitor identifiers.
- [x] Implement atomic shared admission with bounded REST/strict schemas, no retries/refunds/local fallback, fail-closed 503, and 429/Retry-After/UI cooldown before the enabled public pipeline. Keep AI/Google disabled.
- [x] Verify actual atomic Lua/concurrency/window/expiry behavior with isolated local Redis; add the local integration check to CI without hosted credentials.
- [x] Verify 342 app tests plus five opt-in real Redis cases, app lint/types/build, MCP checks/45 tests, local production axe, and disabled Discover 320px browser smoke; no live Google/Upstash, no external requests on Discover, and no client-chunk Upstash markers.
- [x] Operator reports hosted Upstash creation and Vercel Production variables; local PING and isolated temporary-key atomic EVAL passed, with no Google call or production-counter mutation.
- [x] Record operator confirmation: existing services Free/no-payment and Upstash eviction disabled; no independent dashboard inspection claimed.
- [ ] Verify Vercel runtime access using an approved protected method. The production counter key was not exercised by isolated local checks.

See [`docs/AI_OPERATIONS.md`](../docs/AI_OPERATIONS.md). No model calls, user identifiers, prompts, results, movie IDs, or raw errors are included in telemetry.

## 6.9 Hardening and Phase Closure

- [x] Triage/fix production dependency advisories without broad major upgrades: root and MCP production-only audits now report zero vulnerabilities. Full audits retain documented development-tool findings.
- [x] Verify application lint, types, build, 286 unit/mock-integration tests, MCP lint/types/build/45 tests, and Home/Watchlist/Discover axe audits.
- [x] Verify standalone MCP Docker build and local health/unauthenticated-auth smoke.
- [x] Update README, deployment/operations docs, architecture, and phase tracking.
- [x] Run authenticated server-only MCP adapter against Render: all five read-only tools succeeded in 3,253 ms; no Google call. The verifier now sets its validated remote endpoint when local `MCP_SERVER_URL` is absent.
- [x] Measure `/health` and an MCP initialize-only handshake after 16-minute windows with no agent requests: 12,542 ms and 13,889 ms; external traffic could not be observed, so the samples are indicative.
- [x] Raise only MCP initialization timeout to 20s; retain 30s global, 35s route/UI, and 10s per-tool caps. Explain free-tier cold starts in pt-BR UI only when AI is enabled.
- [ ] Confirm Vercel runtime-to-Render without generation and approve an honest bounded cold-start policy; 20s init is not guaranteed to cover all Render Free wake-ups.
- [ ] Close D1–D5 for the approved Google/model path: applicable privacy/audience/region, production composition and separate live-test/public-activation gates. No new provider/model, paid use or live inference is authorized.

**Phase 6 remains open** until D1–D5 and remaining runtime/cold-start gates pass or scope is explicitly amended. Keep `/discover` generation disabled temporarily; a usable real-AI demo, not permanent unavailability, is the final objective.
