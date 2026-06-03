# Movie Explorer — README Strategy

## 1. README Goal

The goal of the README at this stage of the project is to clearly and honestly define what the Movie Explorer application is today, while framing it as a project in active evolution. 

It should serve as a professional portfolio piece by highlighting:
- The solid current core features and technologies (Vite, React 19, TypeScript, Tailwind CSS, Vitest).
- A transparent disclosure of current technical debt, security limitations, and known bugs.
- A highly detailed, phase-by-phase architectural roadmap showing how the project is being evolved into a production-grade, AI-native, and fully compliant (WCAG 2.1 AA) application.

By adopting this approach, the README builds trust with senior developers or hiring managers by showing production-minded awareness, strict attention to detail, and a structured engineering process, rather than presenting a finished product with hypothetical claims.

---

## 2. Current README Risk

Publishing an aspirational README that claims the integration of Next.js App Router, Server Components, Server Actions, standalone MCP Servers, Multi-Agent Systems, Docker containers, automated CI/CD pipelines, or complete WCAG 2.1 AA accessibility compliance is highly risky.

If a recruiter, senior engineer, or reviewer opens the codebase expecting these features, they will quickly discover:
- A simple client-side Vite Single Page Application (SPA).
- Axios requests made directly from the client, exposing the TMDB API key in raw network traffic.
- Linting failures due to React hook rule violations.
- Multiple high-severity accessibility flaws (e.g. nested interactive controls, missing input labels, language mismatch).
- No Dockerfiles or GitHub Actions files.

This discrepancy between documentation and actual implementation would suggest a lack of technical accuracy, poor validation practices, and exaggerated portfolio claims.

---

## 3. What the README Can Claim Today

The README can confidently and truthfully state that the project currently implements the following:
- **Vite SPA Architecture**: A client-side Single Page Application using Vite.
- **Modern React**: React 19 core version usage.
- **TypeScript & Strict Mode**: Explicit typing with `"strict": true` compile checks.
- **Tailwind CSS**: Utility-first styling integrated with a custom design configuration (Space Grotesk, Inter, and color palettes).
- **Core Features**:
  - TMDB API consumption directly from the client.
  - Interactive movie browsing (popular movies & trending movies toggleable by day or week).
  - Search input with a custom 500ms debounce.
  - Rich movie details view containing backdrop/poster images, runtime, release date, director, genres, and overview.
  - Responsive embedded YouTube trailer player using iframes.
  - Cast member cards and similar movies horizontal scroll layout.
  - Client-side persistent Watchlist synced to `localStorage` via React Context.
- **Testing suite**: Basic unit tests implemented with Vitest and React Testing Library (covering Header links, MovieCard toggling behavior, and WatchlistContext).

---

## 4. What the README Must Not Claim Yet

To maintain strict technical accuracy, the README must **not** state that the following features are implemented (instead, they must be marked as future goals/roadmap targets):
- **Next.js & App Router**: No SSR (Server-Side Rendering), file-system routing, `/app` structure, or App Router layouts.
- **React Server Components (RSC) & Server Actions**: No server-side rendering or database/action mutations.
- **Server-Side TMDB API Consumption**: No proxy API or server-side fetch wrapper to hide keys.
- **Production-Grade Security**: The TMDB API key is currently exposed in client network requests.
- **MCP Server & Multi-Agent Systems**: No Model Context Protocol servers, orchestrators, search agents, or Vercel AI SDK integrations.
- **DevOps Pipelines**: No Docker container support, GitHub Actions, Lighthouse CI metrics, or automated axe-core accessibility tests.
- **WCAG 2.1 AA Compliance**: Multiple accessibility violations exist.

---

## 5. Recommended README Structure

The proposed structure for the main `README.md` is as follows:

1. **Project Title & Brief Description**
2. **Current Status** (Honest statement clarifying that the project is an active Vite-to-Next.js and AI-native evolution case study)
3. **Live Demo** (Link to live version, if available)
4. **Features Implemented**
5. **Tech Stack**
6. **Architecture Today** (Vite SPA client-only flow)
7. **Known Limitations & Technical Debt** (Exposed key disclosure, ESLint violations, and current a11y status)
8. **Current Roadmap** (Phases 1-7)
9. **Getting Started** (Installation and setup instructions)
10. **Environment Variables**
11. **Available Scripts**
12. **Testing**
13. **Accessibility Status**
14. **Security Status**
15. **Future Architecture** (Mermaid diagram of the target Next.js + Server-Side API + MCP Agent architecture)
16. **Screenshots**
17. **Next Steps**

---

## 6. Suggested Positioning

For portfolio purposes, the narrative should position the project as a **progressive engineering case study**:

> **"Movie Explorer is not just a movie search application; it is an active, transparent case study in modern frontend migration, security hardening, and AI-native adaptation. The project represents a real-world scenario: taking a functional, client-heavy Vite Single Page Application and systematically re-architecting it to meet production-level security, accessibility, performance, and automation standards."**
>
> **"Rather than hiding the standard trade-offs and code quality challenges of rapid client-side prototyping, this repository documents them openly in a Current State Audit. The roadmap outlines a disciplined transition toward a secure, Next.js App Router-powered backend, WCAG 2.1 AA accessibility validation, and a Model Context Protocol (MCP) multi-agent orchestrator. Follow along as the project transitions from a client-side prototype to a production-grade AI-native platform."**

---

## 7. Roadmap for README

The roadmap will be structured into the following distinct development phases:

### Phase 1 — Stabilization
- Fix current lint errors and warnings.
- Resolve the React Hooks rule violation (conditional hook call) in the movie details page.
- Refactor the Watchlist state initialization to use lazy loading, avoiding unnecessary mount-write cycles to `localStorage`.
- Add a dedicated `typecheck` script (`tsc --noEmit`) to `package.json`.

### Phase 2 — Accessibility Baseline
- Separate the Watchlist toggle button from the parent `Link` anchor tag in `MovieCard.tsx` to fix keyboard focus trapping.
- Add an `aria-label` attribute to the search input in `Home/index.tsx`.
- Update `index.html` from `lang="en"` to `lang="pt-BR"` to resolve Portuguese language reader mismatches.
- Add `role="status"` and `aria-live="polite"` to `LoadingSpinner.tsx`.
- Add `aria-pressed` states to the popular/trending and today/week toggle buttons.
- Implement a "Skip to Main Content" link at the top of the body layout.

### Phase 3 — Security Baseline
- Relocate all TMDB API calls to run server-side (using an intermediate API proxy or Route Handlers).
- Remove `VITE_TMDB_API_KEY` references from client bundles and network query strings.
- Add a standardized `.env.example` file.

### Phase 4 — DevOps Baseline
- Add a custom `Dockerfile` and `.dockerignore` for containerized deployments.
- Build a GitHub Actions CI workflow to run testing, typechecking, and linting on push/pull requests.
- Incorporate Lighthouse CI checks for performance and SEO tracking.
- Set up automated axe-core scans inside testing pipelines to enforce accessibility rules.

### Phase 5 — Next.js Migration
- Migrate the project configuration and build chain from Vite to Next.js App Router.
- Structure routes using Next.js file-based routing (`/app` directories).
- Transition component pages to React Server Components (RSC) to minimize client-side JavaScript payloads.

### Phase 6 — AI-native Layer
- Build a standalone Model Context Protocol (MCP) Server.
- Create specialized agents (Orchestrator, Search, Quality) using the Vercel AI SDK and Gemini integrations.
- Introduce validated semantic search caching and natural language movie discovery features.

### Phase 7 — Premium UI Polish
- Transition the visuals to an "Immersive Minimalism" design system with responsive layouts.
- Implement glassmorphism styles, fine-tuned micro-interactions, and motion animations.
- Refine loading skeleton structures, error boundary presentations, and empty state visual cues.

---

## 8. Badge Strategy

### Current Possible Badges (Ready to use)
- ![React v19](https://img.shields.io/badge/React-19.2.0-blue?logo=react)
- ![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?logo=vite)
- ![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript)
- ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.18-06B6D4?logo=tailwindcss)
- ![Vitest](https://img.shields.io/badge/Vitest-4.0.16-76E2F2?logo=vitest)

### Future Badges (To be added post-implementation)
- ![CI Build Status](https://img.shields.io/badge/CI-Passing-brightgreen?logo=github-actions)
- ![Lighthouse Score](https://img.shields.io/badge/Lighthouse-100%2F100-success?logo=lighthouse)
- ![axe-core](https://img.shields.io/badge/Accessibility-axe--core-blueviolet)
- ![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)
- ![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
- ![MCP Native](https://img.shields.io/badge/MCP-Server-orange)
- ![AI SDK](https://img.shields.io/badge/Vercel_AI-SDK-blue)

---

## 9. README Acceptance Criteria

The main project `README.md` will be ready for update only when:
- `docs/CURRENT_STATE.md` exists and is finalized.
- `docs/README_STRATEGY.md` exists and is approved.
- The updated README explicitly separates the current functional scope from future strategic phases.
- No unimplemented tools (Next.js, Vercel AI SDK, MCP, Docker, CI) are marketed as active features.
- Current lint failures, testing scopes, and security compromises are clearly disclosed.
