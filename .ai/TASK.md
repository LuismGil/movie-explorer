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

**Status:** Planned  
**Goal:** Introduce a standalone MCP server for TMDB and a validated three-agent AI orchestration flow without exposing secrets or rendering raw LLM output.

## Entry Gates

- [ ] Phase 5 production deployment is verified.
- [ ] `TMDB_API_KEY` remains server-side only.
- [ ] `GOOGLE_AI_API_KEY` is available locally and in the deployment environment.
- [ ] AI provider and model strategy are confirmed.
- [ ] MCP server runtime and transport strategy are confirmed.
- [ ] Phase 6 implementation plan is reviewed and explicitly approved.

## MCP Server Foundation

- [ ] Create the MCP server as an independent package/process.
- [ ] Define package boundaries and runtime scripts.
- [ ] Keep the MCP server isolated from the Next.js UI runtime.
- [ ] Add strict TypeScript configuration.
- [ ] Add environment validation with Zod.
- [ ] Add structured logging and safe error handling.
- [ ] Add health/readiness verification.
- [ ] Document local development and production execution.

## TMDB MCP Tools

- [ ] Implement `search_movies`.
- [ ] Implement `get_movie_details`.
- [ ] Implement `get_recommendations`.
- [ ] Implement `get_trending`.
- [ ] Implement `get_credits`.
- [ ] Define Zod input schemas for every tool.
- [ ] Define normalized structured outputs.
- [ ] Add pagination and result limits.
- [ ] Add timeout and retry policies.
- [ ] Prevent secrets from appearing in logs or tool responses.
- [ ] Add unit and integration tests for every tool.

## Orchestrator Agent

- [ ] Define supported user intents.
- [ ] Implement intent classification.
- [ ] Create structured execution plans.
- [ ] Select the minimum required MCP tools.
- [ ] Enforce tool-call and token budgets.
- [ ] Reject unsupported or unsafe requests.
- [ ] Return structured results only.

## Search Agent

- [ ] Execute MCP tool calls.
- [ ] Aggregate results from multiple tools.
- [ ] Normalize movie data.
- [ ] Deduplicate movies.
- [ ] Preserve TMDB identifiers and factual metadata.
- [ ] Handle partial tool failures.
- [ ] Return structured context to the validation agent.

## Quality/Safety Agent

- [ ] Validate factual claims against MCP/TMDB results.
- [ ] Reject unsupported recommendations or invented metadata.
- [ ] Detect missing or contradictory data.
- [ ] Apply output schemas.
- [ ] Sanitize user-visible content.
- [ ] Prevent raw LLM responses from reaching the UI.
- [ ] Return approved structured UI data only.

## AI Provider Integration

- [ ] Integrate the approved AI provider through the Vercel AI SDK.
- [ ] Keep `GOOGLE_AI_API_KEY` server-side.
- [ ] Define model selection rules for Flash and Pro-class models.
- [ ] Configure timeouts, retries, and abort signals.
- [ ] Define token budgets per request and per agent.
- [ ] Add graceful provider failure handling.
- [ ] Validate all model outputs with schemas.

## Streaming UI

- [ ] Define the server-side AI entry point.
- [ ] Stream only validated progress and final structured data.
- [ ] Add loading, error, empty, and cancellation states.
- [ ] Maintain accessible announcements for streamed updates.
- [ ] Avoid exposing chain-of-thought or internal agent reasoning.
- [ ] Avoid rendering raw Markdown or unvalidated model output.

## Cache and Observability

- [ ] Define TMDB response caching.
- [ ] Define semantic cache boundaries.
- [ ] Prevent user-specific data leakage between cache entries.
- [ ] Record tool latency and failure rates.
- [ ] Record token usage without logging sensitive prompts.
- [ ] Add request correlation identifiers.
- [ ] Define rate limits and abuse protection.

## Security and Accessibility

- [ ] Verify no AI or TMDB key reaches the client bundle.
- [ ] Validate all user input server-side.
- [ ] Sanitize all user-visible AI content.
- [ ] Protect AI endpoints against abuse.
- [ ] Maintain WCAG 2.1 AA keyboard navigation.
- [ ] Add accessible names and live-region behavior where required.
- [ ] Run axe-core with no critical or serious violations.

## Testing and Verification

- [ ] Unit tests for MCP schemas and tools.
- [ ] Integration tests for MCP-to-TMDB communication.
- [ ] Unit tests for all three agents.
- [ ] Tests for hallucination and unsupported-claim rejection.
- [ ] Tests proving raw LLM output cannot reach the UI.
- [ ] Tests for provider and MCP failures.
- [ ] Lint passes.
- [ ] Typecheck passes.
- [ ] Unit and integration tests pass.
- [ ] Production build passes.
- [ ] Accessibility tests pass.
- [ ] Docker build and runtime verification pass.

## Documentation

- [ ] Update architecture documentation.
- [ ] Update MCP interface documentation.
- [ ] Document environment variables.
- [ ] Document agent responsibilities and boundaries.
- [ ] Document security and validation flow.
- [ ] Update `docs/ANATOMY.md`.
- [ ] Update `.ai/PLAN.md`.
- [ ] Update `.ai/CONTEXT.md`.
- [ ] Update the README only after implemented behavior is verified.

## Definition of Done

- [ ] MCP server runs as an independent process.
- [ ] All five TMDB tools are implemented and tested.
- [ ] Orchestrator, Search, and Quality/Safety agents are separated.
- [ ] Every model output is schema-validated.
- [ ] No raw LLM output reaches the UI.
- [ ] No secrets are exposed to the browser.
- [ ] Streaming UI is accessible and resilient.
- [ ] CI, Docker, tests, build, and accessibility checks pass.
- [ ] Documentation reflects the real implemented state.