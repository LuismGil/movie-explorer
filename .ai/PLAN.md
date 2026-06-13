# Movie Explorer v2
> **Active agent objective.** This file is the authoritative execution anchor for the current session.
> Agents MUST read this before any code action. Update task status in-place as work completes.
> When this plan is fully executed, archive it to `.ai/context/archive/` and regenerate from the roadmap.

---

## Mission Statement

Transform `movie-explorer` from a legacy Vite SPA (score 2.5/10) into a 2026-grade, AI-native, production-ready platform (target 8.5/10) by executing 7 sequential phases. Each phase is self-contained and produces a deployable increment.

**Anchor documents** (read before touching code in each phase):
- `ARCHITECTURE.md` — structural truth (generate after Phase 5)
- `movieexplorer-audit_report-v2.md` — gap inventory
- `movieexplorer-implementation_plan-v2.md` — remediation spec
- `README.md` — final desired state

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

**Rule**: Do NOT start Phase N+1 until all tasks in Phase N are checked `[x]`.  
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
- [x] **5.1** Install Next.js 15+ and the React Compiler Babel plugin. Update `package.json` scripts: `dev` → `next dev`, `build` → `next build`, `start` → `next start`.
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
- [x] **5.10** Enable the React Compiler Babel plugin in `next.config.ts`. Delete all `useMemo` and `useCallback` calls that exist purely for performance (not for referential stability needed by `useEffect`). The compiler handles memoization automatically.
### Post-Migration Cleanups
- [x] Fixed Tailwind production purge by adding `./app/**/*` to `tailwind.config.js`.
- [x] Centralized static UI copy in `src/i18n/messages.ts` and `src/i18n/index.ts`.
- [x] Replaced hardcoded JSX strings and accessible labels with centralized messages.
- [x] Verified SecureCoder i18n warnings for static JSX copy.
- [x] Verified TypeScript path alias imports using `@/* -> ./src/*`.
- [x] Synchronized `.ai/TASK.md`, `.ai/PLAN.md`, `.ai/CONTEXT.md`, and `docs/ANATOMY.md`.

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

> ⚠️ **User approval required before starting**: confirm Google AI (Gemini) API key is provisioned.

### 6A — MCP Server

- [ ] **6.1** Create `mcp-server/package.json` — standalone Node package. Dependencies: `@modelcontextprotocol/sdk`, `zod`, `axios` (server-only), `typescript`.
- [ ] **6.2** Create `mcp-server/index.ts` — MCP Server entry point. Registers all 5 tools. Starts with `StdioServerTransport` in dev, `SSEServerTransport` in production.
- [ ] **6.3** Create `mcp-server/tools/search-movies.ts`:
  - Input schema (Zod): `{ query: string, page?: number }`
  - Calls TMDB `/search/movie` with server-side key
  - Returns: `{ results: MovieSummary[], total_pages: number }`
- [ ] **6.4** Create `mcp-server/tools/get-movie-details.ts`:
  - Input: `{ movieId: string }`
  - Returns: full TMDB movie object
- [ ] **6.5** Create `mcp-server/tools/get-recommendations.ts`:
  - Input: `{ movieId: string }`
  - Returns: `{ results: MovieSummary[] }`
- [ ] **6.6** Create `mcp-server/tools/get-trending.ts`:
  - Input: `{ window: "day" | "week" }`
  - Returns: `{ results: MovieSummary[] }`
- [ ] **6.7** Create `mcp-server/tools/get-credits.ts`:
  - Input: `{ movieId: string }`
  - Returns: top 10 cast + director from crew
- [ ] **6.8** Add `"mcp:dev": "tsx mcp-server/index.ts"` and `"mcp:build": "tsc -p mcp-server/tsconfig.json"` to root `package.json`.

### 6B — Multi-Agent System

- [ ] **6.9** Install Vercel AI SDK (`ai`, `@ai-sdk/google`). Configure `GOOGLE_AI_API_KEY` in `.env.local`.
- [ ] **6.10** Create `src/server/agents/token-budget.ts`:
  - Exports `TokenBudget` class tracking per-agent token usage per request.
  - Enforces hard limits: Orchestrator 4096, Search 2048, Quality 1024 input tokens.
  - Implements semantic cache: store query embeddings; on new query compute cosine similarity; if ≥ 0.95 against cached query, return cached result (no LLM call).
  - Logs usage to an in-memory store accessible by `GET /api/telemetry/tokens`.
- [ ] **6.11** Create `src/server/agents/orchestrator.ts` (Gemini 3 Pro):
  - Receives raw user query string.
  - Classifies intent into one of: `browse | search | recommend | conversational`.
  - Generates a structured execution plan: `{ intent, searchQuery?, movieId?, timeWindow? }`.
  - Token budget: enforce 4096 input token max via `TokenBudget`.
  - Returns a typed `OrchestratorPlan` object.
- [ ] **6.12** Create `src/server/agents/search-agent.ts` (Gemini 3 Flash):
  - Receives `OrchestratorPlan`.
  - Connects to MCP Server as a client (`@modelcontextprotocol/sdk` client).
  - Calls the appropriate MCP tools based on the plan.
  - Aggregates and deduplicates results.
  - Returns `SearchResult[]` with TMDB-sourced metadata.
  - Token budget: enforce 2048 input token max.
- [ ] **6.13** Create `src/server/agents/quality-agent.ts` (Gemini 3 Flash):
  - Receives `SearchResult[]` + original query.
  - Validates each result: checks factual consistency (title/year match TMDB data), content safety (no adult content unless `include_adult=true`), hallucination detection (rejects any field not present in the TMDB source data).
  - Returns only validated results; rejects with a typed error if nothing passes.
  - Token budget: enforce 1024 input token max.
- [ ] **6.14** Create `app/api/chat/route.ts` — Next.js Route Handler:
  - Accepts `POST { messages: Message[] }`.
  - Extracts latest user message.
  - Checks semantic cache (via `TokenBudget`).
  - Runs Orchestrator → Search Agent → Quality Agent pipeline.
  - Streams validated results back using Vercel AI SDK `StreamingTextResponse`.
- [ ] **6.15** Create `app/api/telemetry/tokens/route.ts` — `GET` handler:
  - Returns JSON: `{ perAgent: { orchestrator, search, quality }, cacheHitRate, totalCalls }`.
- [ ] **6.16** Create `src/components/AIChatPanel.tsx` (`"use client"`):
  - Uses Vercel AI SDK `useChat` hook pointing to `/api/chat`.
  - Chat input replaces the static keyword search input.
  - Renders agent-generated movie cards using existing `<MovieCard>` component.
  - Shows a streaming typing indicator while the pipeline runs.
  - Displays token telemetry summary (cache hit rate, cost estimate) in a collapsible panel.

### Phase 6 Verification
```bash
npm run mcp:dev &   # MCP server starts on stdio
npm run dev         # Next.js starts on :3000
# Manual: type "A thriller set in space" in the chat panel
# Expected: Orchestrator classifies as 'search' → Search Agent calls MCP search_movies
#           → Quality Agent validates → streaming movie cards appear
# Manual: repeat same query → verify cache hit in /api/telemetry/tokens response
# Manual: hit GET /api/telemetry/tokens → verify per-agent breakdown JSON
npm run test        # agent mock tests pass
```
**Commit**: `feat(ai): add MCP Server (5 TMDB tools) + 3-agent MAS pipeline (Orchestrator→Search→Quality)`

---

## Phase 7 — Premium UI Polish (Immersive Minimalism)

> **Goal**: The UI communicates senior-level design sensibility. Every interaction feels intentional.

### Design System Tokens (add to `tailwind.config.ts`)

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

- [ ] **7.1** Apply base tokens above to `tailwind.config.ts`. Add `.glass` as a Tailwind component class in `globals.css`.
- [ ] **7.2** Update `MovieCard.tsx`:
  - Replace flat dark card with `.glass` class.
  - Add `transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(56,189,248,0.12)]` for hover lift.
  - Poster image: `object-cover` with a gradient overlay `from-void/0 to-void/90` revealing title on hover (CSS-only using `group` and `group-hover`).
  - Rating badge: pill with `bg-accent/10 text-accent border border-accent/20`.
- [ ] **7.3** Update `Header.tsx`:
  - Sticky header with `backdrop-blur-md bg-void/80 border-b border-rim`.
  - Logo text in a distinctive font (load `DM Serif Display` via `next/font/google` for the logo, `Inter` body already acceptable here as supporting font — use `Geist Mono` for metadata labels instead).
  - Active nav link: `text-accent` with an animated underline `after:` pseudo-element.
- [ ] **7.4** Update `AIChatPanel.tsx`:
  - Chat input: full-width pill with `.glass`, `border-rim`, focus state `border-accent ring-2 ring-accent/20`.
  - Streaming indicator: three dots animated with staggered `animation-delay` (CSS keyframes).
  - Results grid: staggered reveal using `animation-delay: calc(var(--index) * 60ms)` on each card.
- [ ] **7.5** `MovieCardSkeleton.tsx`: replace with shimmer animation — `bg-gradient-to-r from-surface via-rim to-surface bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]`. Add `@keyframes shimmer` to `globals.css`.
- [ ] **7.6** Add custom error boundary `src/components/ErrorBoundary.tsx` with a branded fallback UI (film-reel icon, actionable retry button, not a generic "Something went wrong").
- [ ] **7.7** Add dynamic QR code component `src/components/QRDemo.tsx`:
  - On the landing page, renders a QR code (use `qrcode.react` library) encoding the current deployment URL.
  - Label: "Scan to demo the AI agent on mobile".
  - Visible only in production (`process.env.NODE_ENV === 'production'`).
- [ ] **7.8** Run Lighthouse in dev mode. Verify LCP < 1.2s, CLS < 0.05. Fix any regressions introduced by animations (use `prefers-reduced-motion` media query to disable transforms for users who opt out).
- [ ] **7.9** Add `prefers-reduced-motion` guard to all CSS `transition` and `animation` declarations:
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

After all 7 phases pass:

- [ ] Run full CI pipeline locally end-to-end: `lint → typecheck → test → axe → lighthouse → docker build`
- [ ] Verify `GET /api/telemetry/tokens` returns correct per-agent breakdown after 10 queries
- [ ] Keyboard-only navigation: tab through entire app, confirm every interactive element has a visible focus ring
- [ ] Screen-reader audit: run VoiceOver or NVDA on `MovieCard`, `AIChatPanel`, `Header` — confirm no confusing announcements
- [ ] Security review: `npm run build` output — confirm no `api_key` string appears in any `.js` chunk
- [ ] Archive this file to `.ai/context/archive/PLAN_v2_complete.md`
- [ ] Update `ARCHITECTURE.md` to reflect the final system structure
- [ ] Tag release: `git tag v2.0.0 -m "Movie Explorer v2 — AI-native, RSC, MCP, WCAG AA"`

---

## Token Budget Reference (for agent calls during implementation)

| Agent | Model | Hard Limit | Cache |
|---|---|---|---|
| Orchestrator | `gemini-2.0-pro` | 4,096 input tokens | None |
| Search Agent | `gemini-2.0-flash` | 2,048 input tokens | Semantic ≥ 0.95 |
| Quality Agent | `gemini-2.0-flash` | 1,024 input tokens | Result-hash dedup |
| **Est. total** | | | **~$0.62 / 1K queries** |

---

## File Creation Map (new files only)

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
*Agent instruction: treat every `[ ]` as a unit of atomic work. Never skip verification blocks. Never start the next phase with an open task in the current phase.*