# Project Context Ledger

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

- **Phase 5 Post-Migration Bugfix: Docker CSS** (Fixed on 2026-06-13)
  - **Root cause**: After the Vite → Next.js migration, [tailwind.config.js](tailwind.config.js) still referenced the deleted `./index.html` and only scanned `./src/**/*`. It did not scan the `./app/**/*` directory where all Next.js App Router pages reside (`layout.tsx`, `page.tsx`, `movie/[id]/page.tsx`, `watchlist/page.tsx`). Tailwind's production purge removed all utility classes used exclusively in `app/` files, causing broken CSS in Docker.
  - **Fix**: Updated the `content` array in `tailwind.config.js` from `['./index.html', './src/**/*.{js,ts,jsx,tsx}']` to `['./app/**/*.{js,ts,jsx,tsx,mdx}', './src/**/*.{js,ts,jsx,tsx,mdx}']`.
  - **Files changed**: `tailwind.config.js` (1 line).
  - **Verification**: `npm run lint` (0 errors), `npm run typecheck` (0 errors), `npm run test -- --run` (3/3 pass), `npm run build` (success). Confirmed Tailwind classes (`min-h-screen`, `bg-slate-950`, `antialiased`, `sr-only`) present in production CSS output (`.next/static/chunks/*.css`).
  - **Docker verification**: Pending user execution of `sudo docker build --no-cache -t movie-explorer:latest . && sudo docker run --rm -p 3000:3000 -e TMDB_API_KEY=dummy movie-explorer:latest` followed by `curl -I` on the CSS asset URL.

## Current Status
- **Active Phase**: Phase 6 — AI-Native Layer (Not started; Phase 5 complete and verified).
- **ESLint**: 0 warnings, 0 errors (via `npm run lint`).
- **TypeScript**: 0 compiler errors (via `npm run typecheck`).
- **Tests**: All unit tests pass successfully (via `npm run test -- --run`).
- **A11y**: 0 critical/serious violations verified by automated axe-core Playwright audit script (`npm run test:a11y`).
- **Lighthouse**: Assertions validated via Lighthouse CI local runs (`npx lhci autorun`). All budgets for Performance, Accessibility, and CLS met.
- **Docker**: Standalone multi-stage Distroless configuration. CSS asset serving fixed via Tailwind content path correction.
- **Security**: No `NEXT_PUBLIC_` API keys, all TMDB fetching isolated server-side.