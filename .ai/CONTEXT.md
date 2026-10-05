# Project Context

## Session: 2026-10-05
**Estado:** Phase 6.4 Search Agent implemented as a deterministic MCP tool executor.
**Archivos principales:** `src/server/agents/search-agent.ts` and `src/server/agents/__tests__/search-agent.test.ts`.
**Comportamiento:** Validates orchestrator-supplied tool plans and MCP responses with Zod; calls only `src/server/mcp/client.ts`; aggregates and deduplicates movies/details/credits by TMDB ID; rejects mismatched IDs; retains successful results on partial failure and returns sanitized per-call status.
**Límites intencionales:** No LLM/provider/model, intent classification, direct TMDB access, UI rendering, global token budget, or production integration was added.
**Verificación local:** root lint, typecheck, production build, and 15 tests pass; MCP lint, typecheck, build, and 42 tests pass. The Search Agent has 8 focused tests. Accessibility audit and live TMDB/MCP integration were not run for this task.
**Gates pendientes:** Phase 5 production verification and all Phase 6.0 approval gates (including hosting, AI credentials/models, tool contracts, and final architecture approval).
**Siguiente tarea:** Phase 6.5 — Quality/Safety Agent, after the unresolved gates are reviewed.

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
- **Active Work**: Phase 6 — MCP Server + Multi-Agent System.
  - 6.1 standalone MCP foundation, 6.2 five MCP tools, 6.3 server-only client adapter, and 6.4 deterministic Search Agent are implemented.
  - 6.4 executes a validated plan supplied by a future Orchestrator; it does not use an LLM or render UI.
  - Phase 5 production deployment and Phase 6.0 approvals remain pending; they block production integration and unapproved AI-provider choices.
- **ESLint**: 0 warnings, 0 errors (via `npm run lint`).
- **TypeScript**: 0 compiler errors (via `npm run typecheck`).
- **Tests**: All unit tests pass successfully (via `npm run test -- --run`).
- **A11y**: 0 critical/serious violations verified by automated axe-core Playwright audit script (`npm run test:a11y`).
- **Lighthouse**: Assertions validated via Lighthouse CI local runs (`npx lhci autorun`). All budgets for Performance, Accessibility, and CLS met.
- **Docker**: Standalone multi-stage Distroless configuration. CSS asset serving fixed via Tailwind content path correction.
- **Security**: No `NEXT_PUBLIC_` API keys, all TMDB fetching isolated server-side.
- **i18n**: 100% compliant with SecureCoder JSX i18n portability checks; no hardcoded user-facing strings, labels, placeholders or titles exist.
- **Phase 6.0: Architecture and Entry Gates** (Approval pending)
  - Architecture draft/review exists; user approvals and production evidence have not been recorded.
  - **Current State versus Target State**: Currently, Next.js owns the existing server-side TMDB integration. The target state introduces an isolated, standalone Node.js MCP server (`packages/mcp-server/`) accessed via a Streamable HTTP transport and Bearer authentication, and a 3-agent orchestration pipeline.
  - **Decisions Frozen**:
    - Transport: Streamable HTTP exclusively.
    - Boundaries: `packages/mcp-server` for MCP; Vercel for Next.js app; Container-based service for MCP.
    - Agents: Orchestrator, Search, and Quality/Safety.
    - Tools: `search_movies`, `get_movie_details`, `get_recommendations`, `get_trending`, `get_credits`.
    - Validation: Zod schemas at all boundaries.
    - Strict stream rules (no raw output).
  - **Unresolved Approval Gates**: Phase 5 production verification, standalone hosting provider, AI credentials/model identifiers, tool-contract review, and final architecture approval.

## 6. Recent Changes

* **Architecture Alignment:** Formalized Phase 6 and Phase 7 roadmap for Multi-Agent & Standalone MCP architecture.
* **MCP Server Foundation:** Built the standalone `packages/mcp-server` with Streamable HTTP transport, Zod environment validation, constant-time bearer authentication, strict origin validation, vitest unit/integration tests, tsup builds, independent ESLint/TSConfig setup, and a separate Dockerfile. Integrated into the root CI workflow via `mcp-gate` job.
  - **Files Changed**: `.ai/ARCHITECTURE.md`, `.ai/MCP_INTERFACE.md`, `.ai/SECURITY.md`, `.ai/SPEC.md`, `.ai/PLAN.md`, `.ai/TASK.md`, `.ai/CONTEXT.md`.
  - **Confirmation**: No package, runtime, UI, or configuration code/dependencies were changed.
* **Search Agent 6.4:** Added a server-only deterministic executor for validated MCP plans, with output schemas, stable ID-based merging, partial failures, and sanitized outcomes. No AI provider or direct TMDB access was added.
  - **Exact Next Step**: Review/close the 6.0 gates before production AI integration; implementation work next is 6.5 Quality/Safety Agent.
