# Phase 3 — Security Baseline

## Active Phase
- Phase 3 — Security Baseline

## Previous Completed Phases
- [x] Phase 1 — Stabilization & Code Quality
- [x] Phase 2 — Accessibility Baseline (WCAG 2.1 AA)

## Current Goal
- Remove TMDB API key exposure from the browser/client bundle.
- Route TMDB calls through a temporary server-side Vite-era proxy.
- Replace `VITE_TMDB_API_KEY` with server-only `TMDB_API_KEY`.

## Tasks
- [ ] **3.1** Inventory current TMDB/API key usage.
  - Search for `VITE_TMDB_API_KEY`, `api_key`, `themoviedb.org`, and `import.meta.env`.
  - Document all files that currently expose or reference the TMDB key (no real secret values).
- [ ] **3.2** Create a server-side TMDB proxy.
  - Preferred path: `server/tmdb-proxy.ts`
  - Read key from `process.env.TMDB_API_KEY` (never use `VITE_TMDB_API_KEY`).
  - Validate required params, return safe JSON errors, do not leak keys.
- [ ] **3.3** Expose internal `/api/tmdb/...` routes:
  - `/api/tmdb/search`
  - `/api/tmdb/movie/:id`
  - `/api/tmdb/trending`
  - `/api/tmdb/movie/:id/recommendations`
  - `/api/tmdb/movie/:id/credits`
- [ ] **3.4** Update `src/services/tmdb.ts` to use internal relative endpoints.
  - Remove all `import.meta.env.VITE_TMDB_API_KEY` usage.
  - Ensure client does not call `api.themoviedb.org` or generate URLs with `api_key=`.
- [ ] **3.5** Update `.env.example` with:
  ```env
  # Server-side only — never set as VITE_
  TMDB_API_KEY=your_tmdb_v3_key_here

  # Future Phase 6 — server-side only
  GOOGLE_AI_API_KEY=your_google_ai_key_here
  ```
- [ ] **3.6** Update package scripts only if needed.
  - If using an Express proxy, make `npm run dev` start both Vite and the proxy.
- [ ] **3.7** Update README only if needed.
- [ ] **3.8** Verify no key exposure remains.
- [ ] **3.9** Update `.ai/CONTEXT.md` after implementation.

## Verification Checklist
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test -- --run`
- [ ] `npm run dev`
- [ ] DevTools Network check:
  - No `api.themoviedb.org` browser requests
  - No `api_key=` browser requests
- [ ] Repo grep verification:
  - No `VITE_TMDB_API_KEY`
  - No direct client-side TMDB calls

## Restrictions
- Do not start Phase 4.
- Do not migrate to Next.js.
- Do not implement MCP.
- Do not implement AI agents.
- Do not add Docker/CI.
- Do not redesign UI.
- Do not commit.
- Do not stage files.