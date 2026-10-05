# Phase 6 — MCP Server + Multi-Agent System

## Active Phase
- Phase 6 implementation — 6.4 Search Agent
- Phase 5 production verification and Phase 6.0 approval gates remain open.

## Previous Completed Phases
- [x] Phase 1 — Stabilization & Code Quality
- [x] Phase 2 — Accessibility Baseline (WCAG 2.1 AA)
- [x] Phase 3 — Security Baseline
- [x] Phase 4 — DevOps Baseline

## Current Goal
- Execute validated, orchestrator-supplied MCP tool plans server-side without adding direct TMDB calls or selecting an unapproved AI provider/model.

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

- [ ] Vercel production deployment successfully verified (Next.js preset, Home, search, movie details, pagination, watchlist work; TMDB_API_KEY server-side only; no direct browser TMDB access).

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

- [ ] Phase 5 production deployment verified.
- [ ] Streamable HTTP approved as the only MCP transport.
- [ ] `packages/mcp-server` approved as the standalone server boundary.
- [ ] Vercel approved as the Next.js deployment boundary.
- [x] Standalone MCP hosting provider selected: Render Free; evaluate free-tier cold starts before production use.
- [ ] Bearer authentication using `MCP_INTERNAL_API_KEY` approved.
- [ ] `GOOGLE_GENERATIVE_AI_API_KEY` available locally and in Vercel.
- [ ] Default and fallback Gemini model identifiers approved.
- [ ] MCP tool contracts reviewed and approved.
- [ ] Final Phase 6 architecture reviewed and approved.

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

**Implementation boundary:** `src/server/agents/search-agent.ts` is a deterministic MCP executor, not an LLM-powered query planner or user-facing agent. The user explicitly requested this 6.4 work; the 6.0 gates above still block production AI integration and deployment decisions.

## 6.5 Quality/Safety Agent

- [ ] Validate factual claims against MCP/TMDB results.
- [ ] Reject unsupported claims and detect contradictions.
- [ ] Apply final DTO output schemas and sanitize content.
- [ ] Ensure no raw LLM output reaches the UI.

## 6.6 Orchestrator Agent

- [ ] Classify intent, plan execution, and select tools.
- [ ] Sequence agents and coordinate pipeline.
- [ ] Enforce global timeout, tool-call budgets, and token budgets.

## 6.7 Validated Streaming UI

- [ ] Stream only validated progress and structured data.
- [ ] Add loading, error, and empty states.
- [ ] Prevent streaming of private prompts, chain-of-thought, or unvalidated Markdown.

## 6.8 Cache, Limits, and Observability

- [ ] Define caching strategies without leaking user data.
- [ ] Record tool latency and token usage.

## 6.9 Hardening and Phase Closure

- [ ] Verify unit, integration, and accessibility tests pass.
- [ ] Verify standalone Docker container build for MCP server.
- [ ] Update final documentation.
