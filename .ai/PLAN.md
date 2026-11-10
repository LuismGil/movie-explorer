# Movie Explorer v2
> **Active agent objective.** This file is the authoritative execution anchor for the current session.
> Agents MUST read this before any code action. Update task status in-place as work completes.
> When this plan is fully executed, archive it to `.ai/context/archive/` and regenerate from the roadmap.

## Current execution state — 2026-11-09

**Active phase: 7, explicitly approved 2026-11-02; full-plan closure remains open.** The user reports activation `8819583` Ready and approved UI work with the unverified Phase 6 limitations carried forward. Activation approval, startup-policy selection and starting Phase 7 are **not** pending decisions. This explicitly amends the original sequential-phase rule, not the outstanding release checks.

This section and the [remaining backlog](#remaining-backlog) take precedence over earlier checkpoint instructions in this file and linked historical reports. `.ai/TASK.md` is the current summary/index, not a second independently maintained backlog. Only the backlog below contains open checkboxes; phase references point back to its IDs.

| Area | Current evidence / limitation |
|---|---|
| Phases 1–4 | Implementation and local evidence recorded below; no new CI run or complete release certification is claimed. |
| Phase 5 | Next.js migration/core-flow verification remain as recorded. React Compiler is now enabled with Next.js integration; R1 is resolved below. |
| Phase 6 | Units 6.1–6.8 implemented. AI enabled in source; `8819583` Ready was operator-reported. R4 is resolved as a documented, risk-based adult-audience decision. R5 passed a scoped production country-header spoof check. R6 remains open; the single authorized R7 browser POST was inconclusive. [R5 evidence](../docs/AI_GEO_CHECK.md) · [R7 evidence](../docs/AI_VERCEL_CHECK.md). |
| Phase 7 | 7.1–7.9 implemented. R3 enforces mobile simulated LCP <1.2s, accessibility 100 and CLS <0.05. R2 now passes locally with canonical font coverage; no hosted release evidence is implied. |
| Source publication | R1/R3 commit `4a4f1ce` and R2 shell commit `3fe0b6b` are on `main`/`origin/main`. Production GETs served the shell and `/discover` returned 200; this confirms reachable content, not a dashboard Ready state or a GitHub Actions result for `3fe0b6b`. |
| Latest validation evidence | Build, lint, typecheck, **424 app tests** (five opt-in Redis cases skipped), client-bundle guard and browser flows pass. Two unchanged-settings LHCI batches: medians **1,056.398 / 1,060.342ms**; accessibility 100 and CLS 0 in every run. Playwright/axe found no violations on Home, detail or empty Watchlist. |

## Resolved since the previous backlog review

- [x] **R1 — React Compiler.** Added `babel-plugin-react-compiler@1.0.0` as a dev dependency and enabled `reactCompiler: true` in `next.config.ts`. No `useMemo`/`useCallback` calls remain under `app/` or `src/`. Lint, typecheck, 424 app tests and production build pass.
- [x] **R3 — Lighthouse release enforcement.** CI explicitly collects three mobile/simulated runs; accessibility 100 and CLS <0.05 use the pessimistic aggregate, while strict LCP <1,200ms uses the median. The unchanged assertions pass against the final local shell candidate. Performance-category score remains a warning because no separate score target is part of the Phase 7 acceptance criteria.
- [x] **R2 — Meet the original mobile performance budget (7.8), locally.** A document-only `proxy.ts` rewrite serves the root shell through an HTML Route Handler while leaving `app/page.tsx` and the other App Router pages intact. The shell retains server TMDB data, search/filter/pagination, detail navigation, Sora/Hanken/Mono plus full Unicode fallbacks, and the existing watchlist storage contract. Gzip, inline font CSS/preloads and a bounded 60s/48-entry process-local TMDB response cache produced two unchanged-settings LHCI medians of **1,056.398ms** and **1,060.342ms**; all six samples were <1,200ms, accessibility 100 and CLS 0. Browser flow/axe checks and 424 app tests pass (five opt-in Redis cases skipped). Source `3fe0b6b` is pushed; production served the shell, but no hosted LHCI run or independent Vercel Ready evidence exists. [Full measurements and limits](../docs/LCP_RENDER_RESULTS.md).

## Remaining backlog

These are existing gaps or missing evidence, not authorization to execute them. Keep unknown conditions open; only explicit operator scope amendments can remove a release requirement, and must not be recorded as a passed verification.

### Implementation and configuration

### External verification and operator work

- [x] **R4 — Resolve adult-audience eligibility on the available facts.** The operator states the expected audience is generally adults; the AI feature is presented as an adult portfolio/technical demo and is not intended or marketed to minors. On the facts supplied, the decision is that it is not directed to, and is not likely to be accessed by, under-18s. Public reach means such access cannot be ruled out, and the self-declaration is not age verification. This is a reasoned assessment, not a guarantee or provider/legal certification. Reassess and disable/use an eligible alternative if audience evidence changes. [Decision and limits](../docs/AI_RELEASE.md).
- [x] **R5 — Verify deployed country-signal trust, within the tested request-path scope.** Baseline and caller-supplied `GB`/`US`/`XX` values all produced the same pre-admission `adult_confirmation_required` decision on four production requests. The test used one external network vantage, not an actual restricted-region source; see [evidence and limits](../docs/AI_GEO_CHECK.md). No diagnostic route or inference was used.
- [ ] **R6 — Complete diagnostic credential / older-deployment cleanup (remaining D4).** Confirm removal of only `AI_RUNTIME_CHECK_API_KEY` from Vercel and address diagnostic-containing older deployments through operator controls. The route is already retired and the key absent locally. Preserve working service credentials; destructive deployment cleanup requires explicit approval. [Retirement evidence](../docs/AI_RUNTIME_CHECK.md).
- [ ] **R7 — Verify the full enabled Vercel/browser AI path (D5/6.9).** The one authorized production browser POST returned HTTP 200 NDJSON but the stream remained at “Preparando o serviço”; no terminal result or clean EOF was verified. The harness closed before completion because its wait selector was incorrect. Treat admission/generation as potentially consumed; no retry/reset is authorized. See [AI_VERCEL_CHECK.md](../docs/AI_VERCEL_CHECK.md). Any further hosted inference needs fresh explicit authorization. Longer Render Free wake-ups remain a known failure mode, not an SLA or reason for implicit retries/keep-alives.
- [ ] **R8 — Run the actual screen-reader audit.** Use VoiceOver or NVDA on `MovieCard`, `AIChatPanel` and `Header`, recording versions, states, announcements and findings. Keyboard/axe evidence remains valid within its scope but cannot close this check; AI states may be exercised with mocks, not implicit live generation.
- [ ] **R9 — Record release-candidate CI and deployment evidence.** Associate an actual GitHub Actions result and Vercel deployment state with the candidate commit. Local test batches and a matching local `origin/main` reference are not hosted evidence; do not label `6e50606` uncommitted or infer Ready from publication. A source push alone does not authorize an application deployment or hosted probe.

### Formal closure, after the applicable gates

- [ ] **R10 — Archive the completed plan.** Only after outstanding requirements are verified or explicitly scope-amended, reconcile current documentation and archive to `.ai/context/archive/PLAN_v2_complete.md`; preserve limitations and evidence provenance.
- [ ] **R11 — Create the v2.0.0 release tag.** Only after the release gates and operator authorization; do not tag or imply WCAG/provider/performance certification from local partial evidence.

## Execution boundaries and deferred scope

- **R2 scope note (2026-11-06):** the R2 candidate passed the local acceptance criteria and was pushed to `main`; production GETs later confirmed the shell is reachable. This does not establish dashboard Ready, hosted Lighthouse performance, or CI. A separate one-call Vercel/browser inference was explicitly authorized on 2026-11-09 and is tracked as R7. Do not reset quotas, retry inference, alter credentials, archive or tag. Preserve the pre-existing `PRD.md` and `next-env.d.ts` changes.
- Preserve the pre-existing `PRD.md` and `next-env.d.ts` changes. Keep the catalog worldwide, existing AI region/adult/quota gates, Google/model policy, 20/30/35s deadlines and manual-only retry behavior unchanged.
- The all-catalog-to-MCP migration is **deferred**, not a new release blocker: popular movies, trailers and pagination need coverage first. Retain the server-side TMDB actions as documented in [the implemented architecture](../ARCHITECTURE.md).
- Historical validation counts and availability/publication statements describe their original batch only. Do not rerun consumed tests, request activation consent again, or treat the historical design examples as permission to replace canonical shared tokens/fonts.

## Historical closeout checkpoints — 2026-11-02

The entries below preserve the original evidence and sequence. Their local-only/no-push statements apply at the time of collection, not the source-publication state above. The render-path preparation was subsequently executed; it is not the next unimplemented task.

**Phase 7 approval:** user reports activation `8819583` Ready and approves UI polish with unverified Phase 6 limitations carried forward. This supersedes the older phase-order/keep-disabled instructions where conflicting; it does not turn unknown release checks into passes. See the Phase 7 block and `docs/UI_POLISH.md` for the original UI scope. No live inference or hosted diagnostic was requested.

**Closeout instruction:** operator asks to finish reachable remaining work, create atomic `type(scope): description` commits per `.ai/COMMIT_GUIDE.md`, and group validations at the end. Performance/resource loading, keyboard/touch semantics, standalone packaging/CI and a scoped bundle-boundary guard are implemented in successive commits; final checks are batched, not repeated as separate gates. Public [architecture](../ARCHITECTURE.md) and [release checklist](../docs/RELEASE_CHECKLIST.md) distinguish evidence from unverified external conditions. Do not infer a push, live AI call, quota reset, full-plan archive or release tag from local closeout.

**Closeout results:** 398 application tests pass plus five separate isolated Redis integration tests and 45 MCP tests. Lint/build TypeScript, standalone assets, 17-file browser-boundary scan, production audits, local browser/keyboard review and final Docker build/200 HTML+CSS smoke pass. Deferred QR rendering is verified; trailer iframe now requires visitor intent after final review found external-player issues. Desktop Lighthouse 100/accessibility100/LCP0.596s/CLS0; mobile96/100/LCP2.669s/CLS0 (initial mobile2.832s). Strict mobile LCP remains open; no goal relaxation or full-plan closure. Docker context reduced141.3MB→1.331MB. Original dev `next-env.d.ts` change and `PRD.md` preserved outside commits. Evidence: `docs/RELEASE_CHECKLIST.md`.

**Font-loading follow-up — 2026-11-02, local `cbf00a9`:** UI subsets plus original, self-hosted complete-family fallbacks with disjoint Unicode ranges reduce initial font transfer91,112→49,272bytes (−45.9%). Fresh alternating three-run mobile comparison against preserved `eb49dcd`: median LCP2.667→2.427s (−9.0%), FCP1.062→0.910s, performance97→98; accessibility100/CLS0 throughout. Desktop sample100/LCP0.530s. 411 app tests pass (five opt-in Redis skipped); lint/types/build/bundle scan, deterministic font regeneration, glyph fidelity and local responsive/keyboard/axe/multilingual/slow-network checks pass. Original display/mono optional-font policy and dynamic glyph availability retained; no duplicate full fonts on the sampled slow initial load. Zero AI requests, no shared quota/provider/control changes, no push. Exact original `next-env.d.ts` and `PRD.md` remain outside commits. The <1.2s mobile target and earlier external release limitations remain open; no full-plan archive/tag. Evidence and sample variation: `docs/RELEASE_CHECKLIST.md`.

**Publication / prepared next increment — 2026-11-02:** the operator now explicitly asks to commit/push the validated font increment and prepare the next step. This supersedes the earlier no-automatic-push boundary for these commits only; Vercel Ready remains unverified. Next: profile the post-font render path using trace/devtools-log artifacts before selecting a runtime change. The median report attributes 81% to estimated render delay, but whole-trace JavaScript/layout totals do not establish causality. Execution and acceptance criteria: [`docs/LCP_RENDER_PLAN.md`](../docs/LCP_RENDER_PLAN.md).

**Render-path follow-up completed locally — 2026-11-02, `6e50606`:** the operator confirms Vercel Ready for published `c3a1cea`; no independent hosted audit. Frozen post-font standalone excludes private env files; trace/devtools-log and Lantern node timings distinguish observed paint from simulated framework work. Split Discover-only copy from catalog clients and added a manifest-scoped bundle guard/positive control: sampled JavaScript150,284→148,635bytes (−1.1%), identical message/formatter behavior and font binaries. Five-run simulated medians LCP2.509→2.380s, but overlapping samples do not prove a reliable LCP gain. This is a retained resource-only improvement; the original1.2s goal remains open. 424 app tests (five opt-in skipped), lint/types/build/bundle/browser flows pass; zero AI requests. No new provider/hosted/Redis/MCP experiment, quota/control change or push. Original `PRD.md`/dev `next-env.d.ts` preserved. Full evidence: [`docs/LCP_RENDER_RESULTS.md`](../docs/LCP_RENDER_RESULTS.md).

- [x] Prepare the render-path investigation and preserve current evidence/guardrails in a durable plan.
- [x] Freeze a post-font standalone baseline and capture attributable traces with zero AI requests.
- [x] Select/test one trace-supported resource optimization; batch validation and compare against the post-font baseline, not only `eb49dcd`. Retain the deterministic byte reduction, not a claimed reliable LCP win.
**Historical status at this checkpoint:** the 2026-11-02 resource-only increment did not close the original mobile LCP budget. R2 was subsequently closed locally by the 2026-11-06 implementation recorded above; release/deployment evidence remains a separate open requirement.

---

## Original roadmap and phase evidence

The phase blocks retain implementation history and verification recipes, not standing authorization to execute them. Completed checks retain their original scope; remaining work points to the canonical backlog above. Historical disabled-generation checkpoints do not override the subsequent authorized activation.

### Mission Statement

Transform `movie-explorer` from a legacy Vite SPA (score 2.5/10) into a 2026-grade, AI-native, production-ready platform (target 8.5/10) by executing 7 sequential phases. Each phase is self-contained and produces a deployable increment.

**Anchor documents** (read before touching code in each phase):
- [`ARCHITECTURE.md`](../ARCHITECTURE.md) — implemented structural truth (already exists).
- [`docs/RELEASE_CHECKLIST.md`](../docs/RELEASE_CHECKLIST.md) — retained validation evidence and limits; publication statements describe the original batch.
- [`README.md`](../README.md) — public overview; where historical status differs, use the current state/backlog above.
- `movieexplorer-audit_report-v2.md` and `movieexplorer-implementation_plan-v2.md` — original roadmap sources, not present in this checkout; not required current execution inputs.

---

## Phase Map (Execution Order)

```
Phase 1 → Stabilization & Code Quality
Phase 2 → Accessibility Baseline (WCAG 2.1 AA)
Phase 3 → Security Baseline (API key lockdown)
Phase 4 → DevOps Baseline (Docker + CI/CD)
Phase 5 → Next.js App Router Migration (RSC)
Phase 6 → AI-Native Layer (MCP + MAS)
Phase 7 → Premium UI Polish (Immersive Minimalism)
```

**Original rule, amended for Phase 7 on 2026-11-02**: Do NOT start Phase N+1 until Phase N is complete unless the user explicitly changes the order. Phase 7 is already authorized with Phase 6 limitations retained.
**Rule**: After each phase, run the verification checklist at the bottom of that phase block.  
**Rule**: Commit atomically at the end of each validated task using Conventional Commits format.

---

## Phase 1 — Stabilization & Code Quality

> **Goal**: Zero ESLint errors, zero TypeScript compiler errors, clean hooks, scripts ready for CI.

### Tasks

- [x] **1.1** Run `npm run lint` and document every error/warning in a scratch list. Do not fix yet — inventory first.
- [x] **1.2** Fix all ESLint errors. Priority order: `react-hooks/rules-of-hooks` violations → `no-unused-vars` → remaining warnings.
- [x] **1.3** Resolve the React Hooks rule violation in `MovieDetailsPage` (hooks called conditionally or after early returns).
- [x] **1.4** Refactor `WatchlistContext.tsx`: replace eager `useState(JSON.parse(localStorage…))` with lazy initializer `useState(() => JSON.parse(…))` to prevent SSR hydration mismatch.
- [x] **1.5** Add `"typecheck": "tsc --noEmit"` to `package.json` scripts.
- [x] **1.6** Run `npm run typecheck` — fix all type errors until exit code 0.
- [x] **1.7** Reduce `Home/index.tsx` from 347 lines: extract `<MovieGrid>`, `<PaginationBar>`, and `<SearchBar>` as standalone components. Each file must be < 150 lines after extraction.
- [x] **1.8** Replace the 14-item `useMemo` dependency array with a properly scoped derived computation or split into smaller memos. (These will be removed entirely in Phase 5, but must not cause bugs now.)

### Phase 1 Verification
```bash
npm run lint        # exit 0, zero errors
npm run typecheck   # exit 0, zero errors
npm run test        # all existing tests pass
```
**Commit**: `fix: stabilize codebase — lint, typecheck, hooks, context refactor`

---

## Phase 2 — Accessibility Baseline (WCAG 2.1 AA)

> **Goal**: Zero `axe-core` critical/serious violations. Full keyboard and screen-reader support.

### Tasks

#### MovieCard.tsx
- [x] **2.1** Extract the watchlist `<button>` from inside the `<Link>` wrapper. Use CSS `position: absolute; z-index: 10` on the button and `position: relative` on the card container so both elements are siblings in the DOM but visually overlapping.
- [x] **2.2** Add `focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none` to every interactive element in the card (the `<Link>` and the watchlist `<button>`).

#### Header.tsx
- [x] **2.3** Add `aria-hidden="true"` to the `🎬` emoji span.
- [x] **2.4** Add `aria-current="page"` to the active `<NavLink>`. Use the `NavLink` `className` callback: `({ isActive }) => isActive ? "... aria-current" : "..."` — note this requires the `aria-current` prop, not the class. Set it conditionally: `aria-current={isActive ? "page" : undefined}`.

#### Home/index.tsx (SearchBar component after 1.7)
- [x] **2.5** Add `<label htmlFor="movie-search" className="sr-only">Search movies</label>` paired with `id="movie-search"` on the `<input>`. Do NOT use only `aria-label` — a visible/hidden `<label>` is preferred for WCAG 2.1 SC 1.3.1.
- [x] **2.6** Add `aria-label={`Go to page ${page}`}` to each pagination `<button>`.

#### LoadingSpinner.tsx
- [x] **2.7** Add `role="status"` and `aria-live="polite"` to the spinner container. Add a visually-hidden `<span className="sr-only">Loading…</span>` inside.

#### Global / Layout
- [x] **2.8** Set `lang="pt-BR"` on the `<html>` element in `index.html` (Vite) or `app/layout.tsx` (post-migration).
- [x] **2.9** Add a "Skip to Main Content" anchor as the very first child of `<body>`:
  ```html
  <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-sky-500 focus:text-white focus:rounded">
    Skip to Main Content
  </a>
  ```
  Add `id="main-content"` to the `<main>` element.
- [x] **2.10** Add `aria-pressed={isInWatchlist}` to all watchlist toggle buttons.
- [x] **2.11** Install `axe-core` and `@axe-core/react` as dev dependencies. Add a dev-mode automatic a11y overlay (axe runs in the browser console in development, not production).

### Phase 2 Verification
```bash
npm run lint        # exit 0
npm run typecheck   # exit 0
npm run test        # pass
# Manual: Tab through entire app — every interactive element must show a visible focus ring
# Manual: Run axe DevTools browser extension on Home, MovieDetail, Watchlist — 0 critical/serious
```
**Commit**: `fix(a11y): achieve WCAG 2.1 AA baseline — nested elements, ARIA, skip nav, lang`

---

## Phase 3 — Security Baseline

> **Goal**: API key removed from client bundle. All TMDB calls proxied server-side.

> ⚠️ **This phase runs on the Vite codebase** (pre-Next.js migration). The server proxy here is a temporary Express/Vite proxy, not the final MCP Server (Phase 6). The pattern is replaced — not duplicated — in Phase 5.

### Tasks

- [x] **3.1** Create `server/tmdb-proxy.ts` — a lightweight Express server (or Vite's `server.proxy` config) that:
  - Reads `TMDB_API_KEY` from `process.env` (server-side only).
  - Exposes routes mirroring TMDB endpoints: `/api/tmdb/search`, `/api/tmdb/movie/:id`, `/api/tmdb/trending`, `/api/tmdb/movie/:id/recommendations`, `/api/tmdb/movie/:id/credits`.
  - Forwards requests to `https://api.themoviedb.org/3/…` with the key appended server-side.
- [x] **3.2** Update `src/services/tmdb.ts`: replace all `https://api.themoviedb.org/3/…?api_key=${import.meta.env.VITE_TMDB_API_KEY}` calls with calls to `/api/tmdb/…` (no key in the URL).
- [x] **3.3** Remove `VITE_TMDB_API_KEY` from `.env`, `.env.example`, and all client-side references. Add `TMDB_API_KEY` (no `VITE_` prefix) to `.env.example` with a comment: `# Server-side only — never set as VITE_`.
- [x] **3.4** Verify: open browser DevTools → Network → confirm no outgoing requests contain `api_key=` in the URL.
- [x] **3.5** Add `TMDB_API_KEY` and `GOOGLE_AI_API_KEY` (placeholder) to `.env.example`. Document both in `README.md` Section 7 (already written — verify it matches).

### Phase 3 Verification
```bash
npm run dev
# Open DevTools → Network — search for any request containing "api_key=" — must find NONE
npm run typecheck   # exit 0
npm run lint        # exit 0
```
**Commit**: `security: move TMDB API key server-side, remove VITE_TMDB_API_KEY from bundle`

---

## Phase 4 — DevOps Baseline

> **Goal**: Reproducible builds in Docker. Every push gated by CI.

### Tasks

#### Docker
- [x] **4.1** Create `Dockerfile` with 3 stages:
  - **Stage 1 `base`**: `node:20-alpine` — install deps only.
  - **Stage 2 `builder`**: copy source, run `npm run build`.
  - **Stage 3 `runner`**: `gcr.io/distroless/nodejs20-debian12` — copy only the built output and `node_modules`. Expose `3000`. Set `NODE_ENV=production`.
- [x] **4.2** Create `.dockerignore`:
  ```
  node_modules
  .git
  .env*
  dist
  coverage
  .next
  ```
- [x] **4.3** Verify `docker build -t movie-explorer:latest .` succeeds and `docker run --rm -p 3000:3000 -e TMDB_API_KEY=<runtime-secret> movie-explorer:latest` serves the app. Verified locally: the container starts the production Express server on port `3000`, serves the Vite `dist` build, and keeps `/api/tmdb/...` available through the server-side proxy.

#### GitHub Actions CI
- [x] **4.4** Create `.github/workflows/ci.yml` with the following sequential jobs (fail-fast: true):
  ```yaml
  jobs:
    lint:       runs: npm run lint
    typecheck:  needs: lint,   runs: npm run typecheck
    test:       needs: typecheck, runs: npx vitest run
    a11y:       needs: test,   runs: axe-core audit (headless Playwright or axe-cli)
    lighthouse: needs: a11y,   runs: Lighthouse CI with budgets (LCP < 1.2s, CLS < 0.05)
    docker:     needs: lighthouse, runs: docker build smoke test
  ```
- [x] **4.5** Add `lighthouserc.json` with performance budgets matching README Section 14.
- [x] **4.6** Add `TMDB_API_KEY` and `GOOGLE_AI_API_KEY` as GitHub Actions secrets (document in README — do not commit values).

### Phase 4 Verification
```bash
docker build -t movie-explorer:latest .          # must succeed
docker run --rm -p 3000:3000 movie-explorer:latest  # must serve app on :3000
# Push to a feature branch → GitHub Actions pipeline must go green end-to-end
```
**Commit**: `ci(devops): add multi-stage Dockerfile, GitHub Actions CI pipeline, Lighthouse budgets`

---

## Phase 5 — Next.js App Router Migration (RSC)

> **Goal**: Delete Vite. All data-heavy pages become async Server Components. `useEffect` data fetches eliminated.

> ⚠️ **User approval required before starting**: confirm Next.js App Router as the target framework.

### Tasks

#### Scaffold
- [x] **5.1 — Next.js scaffold.** Install Next.js 15+ and update the application scripts. Current production scripts build/assemble and start the standalone server. The compiler plugin is now installed; see 5.10.
- [x] **5.2** Create `app/layout.tsx` — root layout with `<html lang="pt-BR">`, skip-nav link, `<Header>`, `<main id="main-content">` wrapper.
- [x] **5.3** Delete `index.html`, `vite.config.ts`, and all `VITE_`-prefixed env references.

#### Page Migration
- [x] **5.4** Migrate Home page: create `app/page.tsx` as an `async` Server Component. Replace `useMovies` hook with direct `await tmdbActions.getTrending()` inside the component. Wrap the movie grid in `<Suspense fallback={<MovieGridSkeleton />}>`.
- [x] **5.5** Migrate Movie Detail page: create `app/movie/[id]/page.tsx` as an `async` Server Component. Fetch details, credits, and recommendations in parallel using `Promise.all`. Each section wrapped in its own `<Suspense>` boundary.
- [x] **5.6** Migrate Watchlist page: create `app/watchlist/page.tsx`. Watchlist state is client-only (localStorage); this page uses `"use client"` and `WatchlistContext` — that is acceptable (leaf-node client boundary).
- [x] **5.7** Move `WatchlistContext.tsx` to `src/context/` and confirm it is only imported from `"use client"` files or a Client Component provider in `layout.tsx`.

#### Server Actions
- [x] **5.8** Create `src/server/actions/tmdb.ts` — Server Actions wrapping all TMDB calls. Mark with `"use server"`. Use `process.env.TMDB_API_KEY` (no Vite prefix). Remove the Phase 3 proxy server (it is now superseded).
- [x] **5.9** Delete `src/services/tmdb.ts` (old Axios client). Confirm zero imports remain.

#### React Compiler
- [x] **5.10** Enable the React Compiler through Next.js `reactCompiler: true` and `babel-plugin-react-compiler@1.0.0`. No `useMemo`/`useCallback` calls remain in `app/` or `src/`; build and the R1 validation batch pass. No LCP benefit is claimed from compiler activation.
### Post-Migration Cleanups
- [x] Fixed Tailwind production purge by adding `./app/**/*` to `tailwind.config.js`.
- [x] Centralized static UI copy in `src/i18n/messages.ts` and `src/i18n/index.ts`.
- [x] Replaced hardcoded JSX strings and accessible labels with centralized messages.
- [x] Verified SecureCoder i18n warnings for static JSX copy.
- [x] Verified TypeScript path alias imports using `@/* -> ./src/*`.
- [x] Synchronized `.ai/TASK.md`, `.ai/PLAN.md`, `.ai/CONTEXT.md`, and `docs/ANATOMY.md`.

### Production Checkpoint — 2026-10-22

- [x] Record the user-reported Vercel deployment at `https://movie-explorer-luis.vercel.app`.
- [x] Run production browser smoke checks for Home/SSR, search, pagination, daily/weekly trending, movie details, and watchlist add/remove/persistence.
- [x] Observe no direct browser TMDB data API/MCP requests or `api_key` query parameters in the tested flows.
- [x] Add a regression test and fix React hydration error #418 when a saved watchlist is loaded through full navigation/reload.
- [x] Verify the fix locally: lint, typecheck, 22 unit tests, production build, browser smoke with no page errors, and no critical/serious axe violations on Home and empty/saved Watchlist.
- [x] Redeploy the fix and repeat production checks without hydration errors: the user confirmed success, and agent live browser smoke passed the core flows with no page errors.

Evidence, reproduction, and verification limits: [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md). The original hydration mismatch is resolved in the deployed app. Phase 5 production verification is closed for the tested core flows; this does not certify AI/MCP integration or replace a full security/performance audit.

### Verification

```bash
npm run dev         # next dev starts, app loads on :3000
npm run build       # next build succeeds, zero errors
npm run typecheck   # exit 0
npm run lint        # exit 0
# Verify in DevTools: Home page HTML arrives from server (not a loading spinner)
# Verify: no outgoing requests to api.themoviedb.org from the browser
```
**Commit**: `feat(rsc): migrate to Next.js App Router — async Server Components, Server Actions, React Compiler`

---

## Phase 6 — AI-Native Layer (MCP Server + Multi-Agent System)

> **Goal**: Semantic, conversational movie search via a 3-agent pipeline backed by a standalone MCP Server.

> **Activation/startup decision — 2026-11-02, subsequently published:** the user delegated startup policy/age-control implementation and explicitly authorized AI activation. Implemented mandatory per-request adult **self-declaration** (not verified age), demand-driven MCP preparation before Google and the enabled server-owned flag. Commit `8819583` was published; the user reports Vercel Ready and explicitly approved Phase 7. No paid service, credential change or new agent-run inference is implied. Remaining geolocation/audience/diagnostic/hosted limitations are R4–R7, not passed checks. Details: [`AI_RELEASE.md`](../docs/AI_RELEASE.md).

- [x] Record explicit public activation authorization; do not ask for it again.
- [x] Implement unchecked adult declaration in the AI UI and enforce its exact versioned header before body processing/shared admission; do not collect age/DOB/documents or claim verified age.
- [x] Select/implement bounded startup under operator delegation: `preparing` before Google, reuse MCP connection, 20s initialization within unchanged 30s pipeline/35s route/UI; no cron, keep-alive or automatic retries.
- [x] Enable the trusted public/Google switch in source while retaining region/adult-declaration/quota gates. No deployment or live inference is implied.
- [x] Publish activation `8819583`; Vercel Ready is user-reported, not an enabled end-to-end verification. No new agent-run live/hosted test is requested.

> **Historical portfolio clarification — 2026-10-30 (pre-activation):** At this checkpoint public AI was off. The intended deliverable was a usable demonstration of real inference within supported movie intents. The user in Brazil accepts Google's unpaid-service data use; Google/model remain approved. Do not re-ask that consent or treat a demo as an exemption. The user approved an AI-only geofence for EEA/Switzerland/UK and unknown country; catalog access remains worldwide. Operator location does not establish visitor age. The subsequent activation/startup decision and publication are recorded above; remaining audience, deployed country-signal and enabled-hosted checks are R4, R5 and R7.

### D1–D5 decision and execution record — 2026-10-29, reconciled 2026-11-04

**Latest UX decision:** the user explicitly wants direct public access without invitations, account creation or requesting a recruiter link. Keep the shared quota and show a real countdown on denial, with a catalog link. A Brazil-only restriction was suggested but never approved or implemented; do not silently add it. Public distribution compatibility and runtime activation remain separate open release work; the countdown does not certify those conditions.

Details, alternatives, data-flow inventory, sources and acceptance gates: [`docs/AI_DEMO_DECISION.md`](../docs/AI_DEMO_DECISION.md). Earlier checkpoints below retain their original disabled-state evidence; current remaining decisions are tracked only in R4–R7.

- [x] Record `5419f86` pushed and user-confirmed Vercel Ready; post-deploy smoke passed `/discover` 200 and AI route 503 `disabled`/`no-store`, startup hint hidden. No runtime MCP/admission/provider path was exercised.
- [x] Historical checkpoint: record `088ef9b` pushed and user-confirmed Vercel Ready. Post-deploy smoke passed Discover 200 with expanded privacy disclosure/terms link, startup hint hidden, and AI route 503 `disabled` with `no-store, no-transform`. That smoke did not exercise Google, hosted admission or Render. The later D4 protected runtime check passed as recorded below.
- [x] Record operator confirmation: all existing services Free with no payment methods; Upstash eviction disabled. No independent dashboard inspection is claimed.
- [x] Record AI Studio user-reported usage/limits `0 / 60` RPM, `0 / 100K` input TPM, `0 / 100` RPD; model/project access is not independently verified.
- [x] Review Google terms: unpaid content improvement/human review, regional data-use exception, separate Paid-only client distribution in EEA/UK/Switzerland, and age/audience restrictions. Consent or preset queries alone do not authorize a worldwide Google Free release.
- [x] Historical pre-activation audit: architecture/model approval alone did not close the separately documented privacy/live-verification gates. Old TASK/architecture summaries had stale next actions. No live provider failure was observed at that point; later D3 supplied the trusted Google assertion and the single D5 live test passed. Public activation was subsequently authorized and published; R4–R7 preserve remaining release limits.
- [x] Document alternatives as contingencies only: Groq Free + ZDR or local-only Ollama. Presets are optional input-risk reduction, not a Google policy exemption or agreed scope change. Do not migrate merely because the user asks about privacy.
- [x] **D1 — Operator location/data-use decision:** user confirms Brazil/LatAm and accepts Google's unpaid-service content improvement/possible human review for the demo. Proceed with the approved Google model; no migration.
- [x] **D1 — Region policy:** user approved and implementation blocks only AI requests from EEA/CH/UK, and fails closed for unknown country. The catalog remains public worldwide; this does not activate generation.
**D1 — Adult-audience eligibility: resolved in R4 on 2026-11-09.** The operator states the expected audience is generally adults and the feature is an adult-oriented portfolio demo, not directed or marketed to minors. Public access leaves residual uncertainty; self-declaration is not age verification or the sole basis for the decision.

**D1 — Vercel geolocation trust: verified in R5 on 2026-11-09 within the recorded request-path scope.** The edge-supplied country decision was unchanged by caller-supplied restricted, allowed, or unknown values. No actual restricted-region source was tested; see [`AI_GEO_CHECK.md`](../docs/AI_GEO_CHECK.md).

**D2 — Audience/distribution decision: resolved in R4 on 2026-11-09 from the operator-provided facts.** Existing model, Free/no-payment, privacy and server-interlock decisions are unchanged. Reassess if credible audience evidence changes; do not reopen consent or presume a redesign.
- [x] **D3 — Local preparation:** at this implementation checkpoint, the route supplied the trusted Google assertion from server-owned availability (then false). Expanded pt-BR disclosure includes improvement use/human review and an official terms link. No browser approval field or new endpoint.
- [x] **D3 — Verify preparation:** lint, typecheck, build and 348 tests pass (five opt-in Redis cases skipped). Production-composition mocks cover disabled traffic, approval after admission, denied admission and rejected browser overrides. No provider calls.
- [x] **D3 — Practical quota UX:** implemented a real hours/minutes/seconds countdown from bounded `Retry-After`, tab-resume catch-up, accessible expiry announcement and catalog link. Manual retry only; no polling, midnight-reset claim or slot reservation. At this checkpoint generation stayed disabled; subsequent activation is recorded above. Historical validation: lint/types/build and 349 tests, five opt-in Redis cases skipped.
- [x] **D4 — Protected method approved/prepared:** user explicitly approved a temporary token-protected runtime check. Implemented POST `/api/internal/runtime-check` with a new optional server-only operator key, fixed Upstash PING/five-second isolated-key EVAL and one fixed Inception search through Render/MCP. No body/query-controlled operations, production-counter access, Google calls, retries or availability change. Lint/types/build and 394 tests pass; local production auth/override/disabled-AI smoke passed. Setup/removal: [`AI_RUNTIME_CHECK.md`](../docs/AI_RUNTIME_CHECK.md).
- [x] **D4 — Investigate repeated deployment 503s:** user confirms deployment/redeploys but caller still reports generic 503. A credential-free production GET returns 405 and POST returns the original `unavailable` JSON with no-store/nosniff (536ms), not 401. In the deployed handler this identifies the missing/invalid operator-token guard before auth/dependency work; changing MCP URL was not supported by that evidence. Local token format is valid; Vercel values were not inspected. Reporting now distinguishes operator-token/configuration/probe failures, allowlists variable names only after auth, and never echoes raw replies. Lint/types/build, 415 tests and an outbound-blocked synthetic production smoke pass; commit/push of the reporting fix is explicitly authorized, hosted verification remains pending. No hosted dependency/Google request or authenticated retry was made during investigation.
- [x] **D4 — Hosted runtime execution:** after deployment of `811d956` and private environment corrections, operator-supplied output reports both checks passed: Upstash PING/isolated EVAL **83ms**, authenticated Vercel→Render/MCP search **928ms**, total **1,015ms**. An earlier attempt had Upstash failed/133ms and MCP passed/12,393ms; the precise Upstash failure cause was not observable. No Google or real admission-counter access. This closes these tested runtime paths, not cold-start acceptance or live generation. Evidence: [`AI_RUNTIME_CHECK.md`](../docs/AI_RUNTIME_CHECK.md).
- [x] **D4 — Local diagnostic retirement:** remove route, implementation/tests, caller/helper/tests, package command and example variable. Local-only extra failure-detail work is removed too. Lint/types/build and 349 remaining tests pass (five opt-in Redis cases skipped); compiled local GET/POST diagnostic return 404 and public AI returns 503/disabled, with outbound fetch blocked. No private env file or unrelated credential was changed.
- [x] **D4 — Hosted route retirement:** `e8b314c` is pushed; credential-free GET and POST to the production diagnostic route both return 404. No dependency work is triggered. At this retirement checkpoint the public AI source switch was still off; activation was authorized/published later.
- [x] **D4 — Local diagnostic-key cleanup:** a presence-only recheck confirms `AI_RUNTIME_CHECK_API_KEY` is absent from local `.env`; no value was read and no other credential was changed.
**D4 — Vercel/older-deployment cleanup: open in R6.** Local/hosted route retirement is complete, but credential/old-deployment handling is unverified.
- [x] **D4 — Cold-start policy:** operator delegated the decision on 2026-11-02; selected bounded demand-driven preparation before Google, existing deadline ceilings, cancellation/catalog escape and manual-only retry. Longer wake-ups can still fail; no SLA or extra hosted measurement is claimed.
- [x] **D5 — Single live-test authorization:** operator explicitly authorized one real Inception search with `gemini-3.1-flash-lite`, respecting shared quota, no retries and public availability off. This permission is consumed by the execution below; no further inference or public activation is implied.
- [x] **D5 — Real local-handler pipeline passed:** normal handler/admission/Orchestrator/Google/Search/Quality/stream reader ran against live services in a private local process, with no listener or source/env changes. One admission, one countTokens and one generation (both HTTP 200), one `search_movies`; `completed`, Quality `approved`, 12 movies including the expected film, clean-EOF stream validated. Usage 214 input/23 output/237 total; 4,275ms overall. One-off executable removed, sanitized receipt preserved. [Evidence and scope](../docs/AI_LIVE_CHECK.md).
- [x] **D5 — Activation decision/source:** user explicitly authorized activation on 2026-11-02 and delegated startup/age controls. The source flag is true with mandatory adult self-declaration, unchanged region restriction and quota. Self-declaration is not verified age/provider eligibility; no new live inference or deployment occurred.
- [x] **D5 — Activation publication:** `8819583` published; user reports Vercel Ready and authorized Phase 7. Activation approval/publication are no longer pending.

**D5 — Enabled hosted verification: open in R7.** The one separately authorized browser request was inconclusive: HTTP 200 NDJSON, no verified terminal event/EOF, and possible admission/generation consumption. Do not retry or reset quota under that authorization. R6 remains open. Keep one global admission/60s and ten/rolling 24h.

> ⚠️ **Phase 6 Implementation Order** (Do not start 6.1–6.9 until 6.0 is approved):
6.0 Architecture and Entry Gates - [Complete; model policy explicitly approved]
6.1 Standalone MCP Foundation - [Completed]
6.2 TMDB MCP Tools - [Completed]
6.3 Server-only MCP Client - [Completed]
6.4 Search Agent - [Completed]
6.5 Quality/Safety Agent - [Completed]
6.6 Orchestrator Agent - [Implemented; one authorized local live pipeline passed; full enabled hosted execution unverified]
6.7 Validated Streaming UI - [Implemented; activation published/user-reported Ready; full enabled hosted execution unverified]
6.8 Cache, Limits, and Observability - [Implemented; Vercel isolated Upstash/Render checks passed per operator output, Free/no-payment/eviction confirmed]
6.9 Hardening and Phase Closure - [Open in R4–R7; activation/startup policy decided and implemented, not pending reapproval]

### 6.0 Architecture and Entry Gates

- [x] Phase 5 production deployment verified: user-confirmed watchlist retest and agent live browser smoke of core flows, without React errors.
- [x] Streamable HTTP approved as the only MCP transport.
- [x] `packages/mcp-server` approved as the standalone server boundary.
- [x] Vercel approved as the Next.js deployment boundary.
- [x] Standalone MCP hosting provider selected: Render Free (cold-start limitation documented; verify suitability before production use).
- [x] Bearer authentication using `MCP_INTERNAL_API_KEY` approved.
- [x] `GOOGLE_GENERATIVE_AI_API_KEY` available locally and in Vercel: non-placeholder presence checked in root `.env` without exposing the value; user confirmed all variables in Production and a successful redeploy. Provider authentication/quota were not tested.
- [x] Default model/fallback policy approved: `gemini-3.1-flash-lite`, no automatic switch to another model, controlled quota/provider errors, and no paid usage authorized.
- [x] Current five MCP tool contracts reviewed and approved.
- [x] Current Phase 6 architecture reviewed and approved; default model/no-alternate-fallback policy was approved separately.

**Approval/configuration record (2026-10-22):** The user explicitly approved the current architecture/contracts (Vercel, standalone Render MCP, Streamable HTTP, Bearer authentication, and five tools). After Google setup, they confirmed all variables in Vercel Production and a successful redeploy; local Google key presence was checked without revealing or transmitting the value. This does not approve model identifiers, fallback behavior, paid API usage, or future contract changes, and is not a provider-authentication test.

**Model approval (2026-10-22; subsequent live check 2026-10-29):** The user explicitly approved `gemini-3.1-flash-lite`, no automatic alternate-model fallback, and controlled failure on quota/provider errors. No paid usage is authorized. One explicitly authorized request confirmed Google authentication/model access for that invocation; account billing/settings were not independently inspected. The operator accepts Google's unpaid-service data use. Activation was subsequently authorized/published; actual audience eligibility remains open in R4. Choosing a model does not prevent charges on a paid project. See [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md#approved-model-policy). Phase 6.5 is deterministic and makes no provider calls.

### Deployment Evidence — 2026-10-23

- [x] Record the user-reported Render Free deployment from `packages/mcp-server` at `https://movie-explorer-ppc2.onrender.com/mcp`.
- [x] Verify remote `/health` and `/ready` return HTTP 200 and unauthenticated `POST /mcp` returns HTTP 401.
- [x] Record user-reported Vercel MCP environment configuration and redeployment; no secrets inspected or committed.
- [x] Record the corrected Vercel scope: user moved/added MCP variables to Production (they had been Development-only), configured the Google variable, and confirmed a successful redeploy. Dashboard values were not inspected.
- [x] Confirm authenticated tool listing and a real TMDB search against Render: user-provided Inspector 1.0.3 output lists all five tools and `search_movies(query=Inception, page=1)` returns TMDB data including movie 27205 (`A Origem`), without an MCP error.
- [x] Verify the local server-only Next.js MCP adapter against deployed Render using the authenticated 5-tool check: all succeeded in 3,253 ms; no Google call. This does not verify Vercel runtime-to-Render.
- [x] Measure a single authenticated MCP initialization after a 16-minute period with no agent-generated requests: connected in 13,889 ms with zero tools called. External traffic could not be observed.
**Cold-start follow-up:** startup policy was subsequently selected/implemented under delegation (D4, 2026-11-02). The earlier sample does not certify maximum wake time; retain that limitation under R7 rather than reopening policy approval.
- [x] Sample `/health` after a 16-minute no-agent-request window: HTTP 200 in 12,542 ms; external traffic remained unobservable.
- [x] Raise only the shared MCP initialization cap from 10s to 20s based on the 13.889s observed handshake; retain 30s orchestrator, 35s route/UI, and 10s per-tool limits. Add pt-BR free-demo cold-start guidance only when AI is available.
- [x] Fix the remote verifier to apply its strictly validated Render endpoint to the app client when local `MCP_SERVER_URL` is unset.

All 6.0 entry approvals and units 6.1–6.8 are implemented. Free/no-payment plans and disabled Upstash eviction are operator-confirmed. D4 verified isolated Vercel→Upstash/Render paths without touching the real admission counter; the original D5 local test consumed one normal shared admission. The AI-only EEA/CH/unknown-country gate is implemented. The observed 13.889s handshake motivated a 20s init cap within unchanged 30/35s totals; bounded demand-driven startup was subsequently selected/implemented. Longer wake-ups remain uncertain. Google access worked for the local invocation; billing dashboards/project limits were not independently checked. Activation `8819583` is published with user-reported Ready, and Phase 7 is explicitly authorized. **2026-11-09 update:** R4 is resolved on the operator-provided intended-audience facts with residual public-access uncertainty; R5 passed the scoped country-header spoof check; the one authorized hosted POST was inconclusive and R7 remains open. R6 remains open; see the current state and backlog above.

### 6.4 Search Agent

- [x] Execute orchestrator-supplied tool plans through the server-only MCP client.
- [x] Validate MCP tool outputs at the Next.js boundary with Zod schemas.
- [x] Aggregate and deduplicate movie, detail, and credits results by TMDB ID.
- [x] Preserve TMDB identifiers and reject mismatched detail/credits IDs.
- [x] Keep successful results when other tool calls fail; return sanitized per-call outcomes.
- [x] Keep the executor deterministic: no direct TMDB access, model provider, or user-facing rendering.

**Historical gate snapshot (2026-11-06):** Entry approvals are complete. One authorized local end-to-end provider invocation and scoped Vercel→MCP/Upstash checks passed in their recorded scope. Google billing/account settings and deployed country-header trust were unverified at that time; R4, R5 and R7 were subsequently updated on 2026-11-09 in the current state/backlog above. The selected cold-start policy is bounded, not an SLA.

### 6.5 Quality/Safety Agent

The tests below describe the original isolated implementation batch; later Orchestrator/UI integration and the single live invocation are recorded above.

- [x] Ground structured factual claims in validated Search Agent results and preserve TMDB identifiers.
- [x] Reject unsupported claims and detect available summary/detail, duplicate, status/outcome, and movie-scoped metadata contradictions.
- [x] Rebuild a strict Zod presentation DTO from evidence, with plain-text normalization, image-path restrictions, bounded inputs, and sanitized issue codes.
- [x] Preserve valid movies on rejected selections/partial Search failures; distinguish successful empty, rejected, and unavailable results.
- [x] Add 77 Quality/Safety tests covering every claim kind, source/proposal limits, unsafe/unknown content, immutable inputs, no-network execution, and mocked Search→Quality integration.
- [x] Verify app lint/types/build and all 99 tests, plus MCP lint/types/build and all 45 tests. No live provider calls, public AI route, or UI wiring added.

Contract and limitations: [`docs/QUALITY_GATE.md`](../docs/QUALITY_GATE.md). The gate is deterministic: free-form narrative is rejected rather than semantically judged, and source provenance must come from server-side Search execution. Conflicts already discarded by Search deduplication cannot be recovered here. Orchestrator integration is implemented below; do not bypass this gate when adding the UI.

### 6.6 Orchestrator Agent

This checkpoint records the original mock-only implementation with generation disabled. It is historical, not a current keep-disabled instruction; see the published activation and remaining R4–R7 limits above.

- [x] Validate/normalize requests, classify strict movie intents, and compile only approved MCP tool plans; reject invented movie IDs and unsupported fields/tools.
- [x] Coordinate Planner→Search→Quality with server-obtained evidence and Quality-only presentation; preserve partial/empty results and require selection when title resolution needs an ID.
- [x] Enforce a 30s global deadline, 20s shared MCP initialization cap, 10s per-tool timeout, 5-call reservation ceiling, and one planner invocation; propagate cancellation with no retry/fallback.
- [x] Add pinned AI SDK 6 Google planning for the approved model, exact-wire-request token preflight (4,096 input / 512 output / 4,608 total), and controlled provider/usage/budget errors. No SDK continuation or paid escalation.
- [x] Keep real Google calls disabled without trusted server/operator Free Tier confirmation; no provider request, public AI route, UI wiring, or secret changes performed.
- [x] Bound/share MCP initialization at 20s, reject redirects, and clear failed/disconnected clients; add cancellation/tool-budget/cold-start-bound regression tests.
- [x] Verify app lint/types/build and 213 tests, including 67 Orchestrator and 32 mock-HTTP Google adapter tests; MCP lint/types/build and 45 tests pass.

Contract: [`docs/ORCHESTRATOR.md`](../docs/ORCHESTRATOR.md). One separately authorized local live provider pipeline and D4 hosted dependency checks passed; billing eligibility, full enabled Vercel/browser execution and maximum cold-start behavior remain unverified. Production dependency audits are clear after same-major updates; remaining development-only audit findings are documented. No production AI certification is implied.

### 6.7 Validated Streaming UI

This checkpoint records the original disabled UI batch. Activation and admission were subsequently implemented; it is not a current instruction to disable the public switch.

- [x] Add `/discover` with token-based styling, centralized pt-BR copy, loading/progress, approved/partial/empty, unsupported/error, cancellation/retry, and explicit movie-selection states.
- [x] Add bounded same-origin JSON→NDJSON entry point; stream only static stage codes and revalidated Quality DTOs, never provider tokens/prompts/raw MCP/Markdown.
- [x] Share only public presentation schemas with the browser; keep evidence, agents, MCP, provider configuration and credentials server-only.
- [x] Validate UTF-8, byte limits, event ordering and clean EOF before rendering any result; discard invalid/truncated/trailing data and stale cancelled responses.
- [x] At the original UI implementation checkpoint, keep the public server gate and Google activation disabled; UI disclosed unavailability, with no fake results or network generation. Activation was subsequently authorized/published; see R4–R7 for the remaining limits.
- [x] Verify lint/types/build, 281 app tests (68 new streaming/handler/UI cases), MCP checks/45 tests, and local standalone Chromium/axe on desktop/mobile with zero violations, page errors or external requests.

Contract and original verification scope: [`docs/STREAMING_UI.md`](../docs/STREAMING_UI.md). Eligibility/privacy approval, shared admission and an actual local pipeline were subsequently addressed within recorded scope. R4 is resolved and R5 has a scoped deployed spoof-check result; full enabled Vercel/browser behavior remains open in R7. 6.8 operations work is recorded below.

### 6.8 Cache, Limits, and Observability

Original implementation/tests below kept generation disabled during development. Activation was subsequently authorized/published; R4–R7 retain the unverified release boundaries.

- [x] Define a no-user-data cache strategy: no prompt, evidence, model decision, tool result, or presentation cache; keep only the process-local MCP connection reuse.
- [x] Record bounded, fixed-cardinality planner/search/quality latency and reported token totals, plus per-tool latency/failures. Do not retain raw prompts, movie IDs, results, credentials, or exception text.
- [x] Add uncached `GET /api/telemetry/tokens` with optional operator-only `AI_TELEMETRY_API_KEY`; fail closed when unset or invalid.
- [x] At this operations implementation checkpoint, document process-local/serverless limitations, preserve token/tool/deadline ceilings, and keep the public generation route disabled. Activation was authorized/published later.
- [x] Record explicit approval for Upstash Redis Free without a payment method or paid plan; one shared admission per 60 seconds and ten per rolling 24 hours for the whole demo. No visitor identifiers, retries/refunds, namespace overrides, or local fallback.
- [x] Implement mandatory atomic admission before the enabled public pipeline, bounded fail-closed REST transport, 429/Retry-After/static error and UI cooldown. The gates remained false during this original implementation checkpoint; activation was authorized/published later.
- [x] Verify concurrency/window/expiry behavior against an isolated local Redis with the real Lua script and independent handlers; no hosted database or Google calls. Include the local integration check in CI.
- [x] Verify limiter checkpoint: app lint/typecheck/build/342 tests plus five opt-in real local Redis cases, MCP checks/45 tests, Home/Watchlist/Discover production axe, and 320px disabled Discover browser smoke. Scoped client-chunk scan contains no Upstash env names/script/key markers. No fresh Lighthouse/Docker build, hosted counter check, or generation was performed for this unit.
- [x] Operator reports provisioning Upstash and configuring Vercel Production; local `.env` PING and isolated temporary-key EVAL passed without touching the production admission key or Google.
- [x] Record user confirmation that all existing services are Free without payment methods and Upstash eviction is disabled; dashboards were not independently inspected.
- [x] Verify the scoped Vercel runtime access via D4 operator-supplied output: isolated Upstash PING/EVAL 83ms and authenticated Render/MCP search 928ms, total 1,015ms; no Google or real admission-key access. This does not close full enabled hosted behavior (R7) or imply a repeat diagnostic.

Operations contract: [`docs/AI_OPERATIONS.md`](../docs/AI_OPERATIONS.md). Telemetry is per-process, non-durable, and not billing reconciliation. Deterministic Search/Quality report zero model tokens; planner totals remain null when provider usage is unavailable.

### 6.9 Hardening and Phase Closure

- [x] Triage/fix production dependency advisories using same-major updates only: root and MCP `npm audit --omit=dev` both report zero vulnerabilities. Full development audits retain documented toolchain advisories; no Tailwind/Lighthouse major change was forced.
- [x] Verify application lint, typecheck, production build, 286 tests, MCP lint/typecheck/build/45 tests, Home/Watchlist/Discover axe checks, and MCP standalone Docker build plus health/unauthenticated-auth smoke.
- [x] Update deployment, operations, architecture, README, and task-tracking documentation with evidence and limitations.
- [x] Execute the authenticated server-only Next.js MCP adapter locally against deployed Render; all five read-only tools succeeded. The subsequent D4 operator output also verifies the fixed authenticated movie search from Vercel. At that checkpoint public AI remained disabled; activation was authorized/published later.
- [x] Measure a Render health wake and MCP handshake after 16-minute no-agent-request windows; results were 12.542s and 13.889s respectively. External traffic could not be observed; handshake exceeds prior 10s init bound.
- [x] Confirm the tested Vercel runtime-to-Render and isolated Upstash paths without generation via the D4 operator-supplied successful output.
- [x] Operator delegated the cold-start decision; bounded on-demand preparation now precedes Google under unchanged 20/30/35s ceilings, with honest wait/timeout UI. Longer wake-ups remain possible.
**Historical Phase 6 closeout snapshot (before 2026-11-09):** activation approval/publication, region-policy selection, startup-policy implementation, D4 runtime probes and the local D5 invocation were complete within their recorded scope. R4, R5 and R7 have since been updated in the current backlog; R6 remains open.

**Phase 6 closure remains open, but does not prohibit the explicitly approved Phase 7 work.** Activation `8819583` is published/user-reported Ready with adult self-declaration and bounded startup. R4 is resolved with its uncertainty documented; R5 passed within the scoped spoof check, R6 remains open, and the single R7 browser attempt was inconclusive. The 2026-11-02 approval amended the phase-order rule; the 2026-11-09 one-attempt authorization is consumed, so do not retry or reset quota.

### Phase 6 Verification
```bash
npm run test        # agent mock tests pass
```
**Commit**: `feat(ai): freeze architecture and prepare for Phase 6 implementation`

---

## Phase 7 — Premium UI Polish (Immersive Minimalism)

> **Goal**: The UI communicates senior-level design sensibility. Every interaction feels intentional.

> **Started 2026-11-02 with explicit operator approval:** the user reports activation deployment `8819583` Ready and approves starting Phase 7 while earlier unverified release limitations remain documented, not passed. This explicitly amends the sequential-phase rule for this work. No new inference, hosted diagnostics, credential/quota changes or provider migration. Design refinement: reuse the canonical shared obsidian/gold/purple palette and Sora/Hanken Grotesk/JetBrains Mono typography instead of introducing the older illustrative cyan/pink palette and a competing font system. Scope: catalog/header/cards, responsive loading/error/empty states, AI presentation only, production mobile QR, reduced motion. Do not change AI access/admission/runtime contracts.

**First-increment evidence (historical):** 7.1–7.7 and 7.9 used the canonical palette/fonts. Build/lint and 35 focused UI tests passed; sampled responsive/axe/reduced-motion checks had no violations, page errors, overflow or AI requests. The initial no-publication/unmeasured-Lighthouse status was superseded by publication and subsequent measurements above. R2's 7.8 gate was later met locally; release/deployment evidence remains open separately. Original scope: [`UI_POLISH.md`](../docs/UI_POLISH.md).

### Historical illustrative tokens — not the canonical design system

The 2026-11-02 refinement superseded these palette/font examples. Use existing `shared/tokens/`, `tailwind.config.js` and canonical Sora/Hanken Grotesk/JetBrains Mono assets; do not implement this older proposal as another pending task.

```ts
// Palette
'void':      '#080B10',   // near-black background
'surface':   '#0F1318',   // card surface
'rim':       '#1E2530',   // subtle border
'accent':    '#38BDF8',   // sky-400 — focus rings + CTAs
'accent-hot':'#F472B6',   // pink-400 — watchlist active
'text-hi':   '#F1F5F9',   // slate-100
'text-lo':   '#64748B',   // slate-500

// Glass effect utility (add as custom CSS class)
// .glass { background: rgba(15,19,24,0.72); backdrop-filter: blur(16px) saturate(180%); border: 1px solid rgba(255,255,255,0.06); }
```

### Tasks

- [x] **7.1** Connect canonical shared tokens to `tailwind.config.js`/layout theme variables; add `.glass` in `src/index.css` (existing stylesheet convention).
- [x] **7.2** Update `MovieCard.tsx`:
  - Replace flat dark card with `.glass` class.
  - Add `transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(56,189,248,0.12)]` for hover lift.
  - Poster image: `object-cover` with a gradient overlay `from-void/0 to-void/90` revealing title on hover (CSS-only using `group` and `group-hover`).
  - Rating badge: pill with `bg-accent/10 text-accent border border-accent/20`.
- [x] **7.3** Update `Header.tsx` (canonical gold palette and Sora/Hanken/JetBrains refinement supersedes the older font examples):
  - Sticky header with `backdrop-blur-md bg-void/80 border-b border-rim`.
  - Logo text in a distinctive font (load `DM Serif Display` via `next/font/google` for the logo, `Inter` body already acceptable here as supporting font — use `Geist Mono` for metadata labels instead).
  - Active nav link: `text-accent` with an animated underline `after:` pseudo-element.
- [x] **7.4** Update `AIChatPanel.tsx`:
  - Chat input: full-width pill with `.glass`, `border-rim`, focus state `border-accent ring-2 ring-accent/20`.
  - Streaming indicator: three dots animated with staggered `animation-delay` (CSS keyframes).
  - Results grid: staggered reveal using `animation-delay: calc(var(--index) * 60ms)` on each card.
- [x] **7.5** `MovieCardSkeleton.tsx`: matching reserved poster/caption geometry, shared-color shimmer and reduced-motion protection in `src/index.css`.
- [x] **7.6** Add branded `src/components/ErrorBoundary.tsx` and wire the real App Router `app/error.tsx` boundary, with film mark, reset/catalog actions and no raw exception display.
- [x] **7.7** Add dynamic QR code component `src/components/QRDemo.tsx`:
  - On the landing page, renders a QR code (use `qrcode.react` library) encoding the current deployment URL.
  - Label: "Scan to demo the AI agent on mobile".
  - Visible only in production (`process.env.NODE_ENV === 'production'`).
**7.8 — R2 met locally; deployment evidence remains open.** Earlier font milestone: three-run simulated mobile median 2.427s, fonts −45.9%. The 2026-11-02 render-path follow-up had five-run medians 2.509s→2.380s, with overlapping ranges and a confirmed JavaScript reduction of 1.1%. Final local shell candidate later passed the unchanged three-run median LCP <1.2s, accessibility 100 and CLS <0.05 gates in two batches. Detailed samples and provenance: `docs/RELEASE_CHECKLIST.md` and `docs/LCP_RENDER_RESULTS.md`.
- [x] **7.9** Add `prefers-reduced-motion` guard to all CSS `transition` and `animation` declarations:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }
  ```

### Phase 7 Verification
```bash
npm run build && npm run start  # production build serves on :3000
# Lighthouse audit: LCP < 1.2s, CLS < 0.05, A11y score 100
# Manual: verify all animations disabled when OS "Reduce Motion" is on
# Manual: verify QR code renders in production build and is absent in dev
npm run test  # all tests still pass
```
**Commit**: `feat(ui): apply Immersive Minimalism — glassmorphic cards, staggered reveals, QR demo, reduced-motion`

---

## Post-Completion Checklist

Completed local evidence and references to the single remaining backlog; formal archive/tag require closure or an explicit recorded scope amendment, not automatic execution:

- [x] Run local pipeline components: lint, production-build TypeScript, app/MCP tests, isolated Redis, browser axe/keyboard, Lighthouse, bundle scan and Docker build/smoke. Performance warnings/strict mobile-budget failure remain explicit; this is not evidence of a GitHub Actions run or complete release pass.
- [x] Verify the real telemetry handler's per-agent breakdown after ten **mocked** Orchestrator requests in the existing test. No new live queries/counter operations.
- [x] Local keyboard review of Home, saved Watchlist, Details and Discover: native interactive targets have visible rings, skip navigation focuses main, no overflow; external media controls after opting into YouTube are outside this certification.
**Screen-reader audit: open in R8.** Actual VoiceOver/NVDA evidence is not supplied by keyboard/axe checks.
- [x] Scoped client-bundle security check:17 browser JavaScript files, no configured secret values or server-only endpoints. Shared `api_key` credential-denial regexes are allowed; marker presence alone is not secret exposure or a comprehensive audit.
**Plan archive: open in R10.** Do not archive this reconciliation as a completed plan.
- [x] Update root `ARCHITECTURE.md` to reflect implemented system boundaries, alongside existing agent guardrails and honest release limitations.
**v2.0.0 release tag: open in R11.** No release tag is created or authorized by this documentation task.

---

## Token Budget Reference (for agent calls during implementation)

| Agent | Model | Hard Limit | Cache |
|---|---|---|---|
| Orchestrator | `gemini-3.1-flash-lite` (implemented; trusted server activation) | 4,096 input /512 output /4,608 total per invocation | No prompt/result cache |
| Search Agent | None; deterministic MCP executor | 0 model tokens | Connection reuse only, no result cache |
| Quality/Safety Agent | None; deterministic evidence gate | 0 model tokens | No evidence/presentation cache |

No alternate-model fallback or paid escalation is approved. Timeouts, token/tool budgets, no-retry behavior and controlled provider errors are implemented. Existing Free/no-payment status is operator-confirmed, not independently audited billing enforcement. The earlier model cost estimate is superseded. A future model-assisted Quality check would require separate architecture/model/privacy approval and could not replace deterministic validation.

---

## Original File Creation Map (historical proposal; actual paths in root ARCHITECTURE.md)

```
movie-explorer/
├── .ai/
│   └── context/
│       ├── active/
│       │   └── PLAN.md              ← this file
│       └── archive/                 ← completed plans go here
├── .github/
│   └── workflows/
│       └── ci.yml                   ← Phase 4
├── app/
│   ├── layout.tsx                   ← Phase 5
│   ├── page.tsx                     ← Phase 5
│   ├── movie/[id]/page.tsx          ← Phase 5
│   ├── watchlist/page.tsx           ← Phase 5
│   └── api/
│       ├── chat/route.ts            ← Phase 6
│       └── telemetry/tokens/route.ts ← Phase 6
├── src/
│   ├── components/
│   │   ├── AIChatPanel.tsx          ← Phase 6
│   │   ├── ErrorBoundary.tsx        ← Phase 7
│   │   └── QRDemo.tsx               ← Phase 7
│   └── server/
│       ├── actions/tmdb.ts          ← Phase 5
│       └── agents/
│           ├── orchestrator.ts      ← Phase 6
│           ├── search-agent.ts      ← Phase 6
│           ├── quality-agent.ts     ← Phase 6
│           └── token-budget.ts      ← Phase 6
├── mcp-server/
│   ├── index.ts                     ← Phase 6
│   ├── package.json                 ← Phase 6
│   └── tools/
│       ├── search-movies.ts         ← Phase 6
│       ├── get-movie-details.ts     ← Phase 6
│       ├── get-recommendations.ts   ← Phase 6
│       ├── get-trending.ts          ← Phase 6
│       └── get-credits.ts           ← Phase 6
├── Dockerfile                       ← Phase 4
├── .dockerignore                    ← Phase 4
├── lighthouserc.json                ← Phase 4
└── ARCHITECTURE.md                  ← post-completion
```

---

*Generated: 2026-06-03 | Source: movieexplorer-audit_report-v2.md + implementation_plan-v2.md + README.md*
*Current agent instruction: use the single remaining backlog above, preserve evidence scope, and respect the explicitly approved Phase 7 phase-order amendment. Historical recipes and open tasks are not execution authorization; do not infer a live experiment, commit, push, archive or tag.*
