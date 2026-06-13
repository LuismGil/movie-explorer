# Phase 5 — Next.js App Router Migration

## Active Phase
- Phase 5 — Next.js App Router Migration

## Previous Completed Phases
- [x] Phase 1 — Stabilization & Code Quality
- [x] Phase 2 — Accessibility Baseline (WCAG 2.1 AA)
- [x] Phase 3 — Security Baseline
- [x] Phase 4 — DevOps Baseline

## Current Goal
- Migrate the current Vite SPA to Next.js App Router while preserving Phases 1–4: accessibility, server-side TMDB security, tests, Docker, and CI.

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

## Restrictions
- Do not implement Phase 6:
  - no MCP Server
  - no Vercel AI SDK
  - no Gemini integration
  - no multi-agent system
  - no semantic cache
  - no token telemetry.

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