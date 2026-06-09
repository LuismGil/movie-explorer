# Phase 4 — DevOps Baseline

## Active Phase
- Phase 4 — DevOps Baseline

## Previous Completed Phases
- [x] Phase 1 — Stabilization & Code Quality
- [x] Phase 2 — Accessibility Baseline (WCAG 2.1 AA)
- [x] Phase 3 — Security Baseline

## Current Goal
- Add reproducible production builds with Docker.
- Add CI/CD pipeline with GitHub Actions.
- Gate every push/PR with lint, typecheck, tests, accessibility checks, Lighthouse budgets, and Docker build validation.

## Tasks

### Docker
- [ ] **4.1** Create a multi-stage `Dockerfile`.
  - Stage 1: `base` using `node:20-alpine`.
  - Stage 2: `builder`, copy source and run `npm run build`.
  - Stage 3: `runner`, preferably `gcr.io/distroless/nodejs20-debian12`.
  - Expose the correct production port.
  - Set `NODE_ENV=production`.
  - Ensure the app can run with the current Vite/Express proxy setup.
- [ ] **4.2** Create `.dockerignore`.
  - Exclude:
    - `node_modules`
    - `.git`
    - `.env`
    - `.env.*`
    - `dist`
    - `coverage`
    - `.next`
- [ ] **4.3** Verify Docker build and runtime.
  - `docker build -t movie-explorer:latest .`
  - `docker run --rm -p 3000:3000 movie-explorer:latest`
  - Confirm the app serves correctly.

### GitHub Actions CI
- [ ] **4.4** Create `.github/workflows/ci.yml`.
  - Sequential pipeline:
    - lint
    - typecheck
    - test
    - a11y
    - lighthouse
    - docker
  - Use fail-fast behavior.
  - Do not expose secrets.
  - Use GitHub Actions secrets for `TMDB_API_KEY` and future `GOOGLE_AI_API_KEY`.
- [ ] **4.5** Add Lighthouse CI config.
  - Create `lighthouserc.json`.
  - Include performance budgets:
    - LCP < 1.2s
    - CLS < 0.05
    - accessibility checks enabled
- [ ] **4.6** Add automated accessibility check.
  - Use axe-core with Playwright or an equivalent headless check.
  - Ensure zero critical/serious violations for core pages where possible.
- [ ] **4.7** Update README only if needed.
  - Document Docker usage.
  - Document CI expectations.
  - Document required GitHub Actions secrets.
  - Do not claim Next.js, MCP, or MAS are implemented yet.
- [ ] **4.8** Update `.ai/CONTEXT.md` after implementation.
  - Add Phase 4 summary.
  - Include changed files.
  - Include verification results.
  - Include known limitations.

## Verification Checklist

```bash
npm run lint
npm run typecheck
npm run test -- --run
npm run build
docker build -t movie-explorer:latest .
docker run --rm -p 3000:3000 movie-explorer:latest
```

### Manual Verification
- App serves from Docker.
- CI YAML is valid.
- `.env` is not copied into image.
- Docker image does not require client-exposed `VITE_` secrets.
- `TMDB_API_KEY` is passed only as runtime/server-side env.

## Restrictions
- Do not start Phase 5.
- Do not migrate to Next.js.
- Do not implement MCP.
- Do not implement AI agents.
- Do not redesign UI.
- Do not commit.
- Do not stage files.