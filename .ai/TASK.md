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

- [ ] Confirm Next.js App Router is approved as the target framework before implementation.
- [ ] Install and configure Next.js.
- [ ] Update package.json scripts:
  - dev → next dev
  - build → next build
  - start → next start
  - keep lint, typecheck, test, and test:a11y.
- [ ] Create app/layout.tsx with:
  - `<html lang="pt-BR">`
  - skip navigation link
  - shared Header
  - `<main id="main-content">`.
- [ ] Create app/page.tsx as the Home route.
- [ ] Create app/movie/[id]/page.tsx as the Movie Details route.
- [ ] Create app/watchlist/page.tsx as the Watchlist route.
- [ ] Use React Server Components by default for data-heavy pages.
- [ ] Add "use client" only where required:
  - Watchlist provider/state
  - localStorage access
  - event handlers
  - interactive search if still client-side.
- [ ] Create a server-only TMDB layer:
  - src/server/tmdb.ts or src/server/actions/tmdb.ts
  - use process.env.TMDB_API_KEY
  - no VITE_ env variables
  - no client-side TMDB key exposure.
- [ ] Replace the temporary Express/Vite TMDB proxy when Next.js server-side access is ready.
- [ ] Remove or retire Vite-specific files only after Next.js works:
  - index.html
  - vite.config.ts
  - Vite-specific scripts/config.
- [ ] Preserve Phase 2 accessibility fixes:
  - no nested interactive elements
  - focus-visible rings
  - labels
  - aria-current
  - aria-pressed
  - decorative aria-hidden
  - loading states with role="status"
  - skip navigation.
- [ ] Preserve Watchlist behavior with localStorage.
- [ ] Preserve Home search/trending behavior.
- [ ] Preserve Movie Details page behavior:
  - details
  - trailer
  - credits/cast
  - recommendations/similar movies.
- [ ] Update Dockerfile for Next.js production runtime.
- [ ] Update .dockerignore if needed.
- [ ] Update GitHub Actions CI if needed.
- [ ] Update Lighthouse CI config if needed.
- [ ] Update Playwright/axe a11y audit script if routes or startup commands change.
- [ ] Update README only with what is actually implemented.
- [ ] Update .ai/CONTEXT.md with Phase 5 start status.

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