# Movie Explorer

[![React](https://img.shields.io/badge/React-19.2.0-blue?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?logo=vite)](https://vite.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.18-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Vitest](https://img.shields.io/badge/Vitest-4.0.16-76E2F2?logo=vitest)](https://vitest.dev)

Movie Explorer is a modern web application designed for exploring popular movies, searching with client-side debouncing, viewing detailed cast listings, playing official YouTube trailers, and maintaining a persistent local watchlist.

---

## 1. Project Overview

Movie Explorer serves as a progressive engineering case study in modern web application migration. Rather than presenting a static, completed portfolio piece with exaggerated capabilities, this repository documents the systematic refactoring of a traditional, client-heavy Single Page Application (SPA) into a highly secure, server-rendered, accessible, and AI-native platform.

This README details the application as it functions today, exposes its active technical debt and security compromises, and provides a clear engineering roadmap to guide its evolution.

---

## 2. Current Status

The application is currently configured as a **Client-Side Single Page Application (SPA)** powered by Vite. It runs on React 19 and utilizes React Router DOM for client-side navigation. All movie data fetching is initiated directly by the client browser targeting TMDB endpoints.

> [!WARNING]
> **Active Linting Failure**: The project builds successfully but fails active ESLint checks due to React Hook rule violations (conditional hook calls), unused hook variables, and Fast Refresh context module export rules.
>
> **Exposed API Key**: The TMDB API key is currently exposed in client-side bundles and network requests.

---

## 3. Features Implemented

- **Interactive Home Dashboard**:
  - Displays popular movies or trending movies (toggleable between daily and weekly options).
  - High-performance movie searching with client-side 500ms debouncing.
  - Page-by-page client-side pagination.
- **Detailed Movie Profile**:
  - Displays comprehensive metadata (poster, ratings, runtime, release date, director, overview, and genre chips).
  - Embedded YouTube video player for official trailers.
  - Profile photos and character listings for the top 10 cast members.
  - Horizontal swipe-navigation for similar movies.
- **Local Persistent Watchlist**:
  - Global state managed via React Context.
  - Instant toggle action on Movie Cards and Detail Pages, persisted via browser `localStorage`.
- **Skeleton Loaders**:
  - Animated CSS loading states (`MovieCardSkeleton`) rendered during movie lists fetching.

---

## 4. Tech Stack

- **Framework / Bundler**: Vite v7.2.4 (React SPA Template)
- **Core Library**: React v19.2.0 (and React DOM v19.2.0)
- **Programming Language**: TypeScript v5.9.3 (Strict Mode enabled)
- **Routing**: React Router DOM v7.9.6 (Client-side browser router)
- **Styling**: Tailwind CSS v3.4.18 (Utility-first framework) with PostCSS v8.5.6
- **Data Fetching**: Axios v1.13.2
- **Testing Runner**: Vitest v4.0.16 with Testing Library (React & User Event)

---

## 5. Architecture Today

The application follows a traditional Vite-based client-only SPA flow. State management, routing, and data operations are processed exclusively within the user's browser:

```
[ Client Browser ]
  ├── React Components (Home, MovieDetails, Watchlist)
  ├── React Context (WatchlistContext) ──> [ Browser localStorage ]
  └── Axios Services (tmdb.ts)
        │
        └── (Direct HTTP Requests with API Key in URL params)
              ▼
       [ TMDB API Server ]
```

---

## 6. Known Limitations

- **Client-Side Fetching Waterfalls**: In `MovieDetailsPage`, four API calls (details, credits, videos, and recommendations) are fetched on the client side using `Promise.all` in `useMovieDetails.ts`. While parallelized, it blocks rendering and depends heavily on client connection speeds.
- **React Hook Order Violation**: In `src/pages/MovieDetails/index.tsx`, the hook `useWatchlist` is called after early loading/error return blocks. This violates the React Rules of Hooks and can cause crashes under specific state combinations.
- **Unoptimized Font Loading**: The `tailwind.config.js` specifies Space Grotesk and Inter font families, but the web fonts are not actually imported inside `index.html`. The browser falls back to system defaults.

---

## 7. Roadmap

The project is being systematically refactored over 7 distinct engineering phases:

### Phase 1 — Stabilization
- [ ] Fix ESLint compiler warnings and code quality errors.
- [ ] Resolve the React Hooks rule violation in `MovieDetailsPage`.
- [ ] Refactor `WatchlistContext.tsx` to use lazy state initialization, avoiding redundant localStorage sync writes.
- [ ] Add a `npm run typecheck` script to `package.json` utilizing `tsc --noEmit`.

### Phase 2 — Accessibility Baseline
- [ ] Refactor `MovieCard.tsx` to extract the interactive Watchlist button outside the parent navigation `Link` anchor tag.
- [ ] Provide an explicit `aria-label` or `<label>` for the search inputs in `Home/index.tsx`.
- [ ] Set `lang="pt-BR"` inside `index.html` to match the application's Portuguese language content.
- [ ] Add `role="status"` and `aria-live="polite"` to `LoadingSpinner.tsx`.
- [ ] Implement `aria-pressed` states on popular/trending and today/week toggle controls.
- [ ] Add a "Skip to Main Content" link at the top of the body container.

### Phase 3 — Security Baseline
- [ ] Move TMDB API consumption server-side.
- [ ] Remove `VITE_TMDB_API_KEY` from client-side runtime environments and bundle variables.
- [ ] Implement a clean backend proxy or Next.js route handler to handle API authentication headers securely.

### Phase 4 — DevOps Baseline
- [ ] Dockerize the application by adding a production-optimized `Dockerfile` and `.dockerignore`.
- [ ] Set up GitHub Actions CI pipelines to automate unit testing, typechecking, and linting.
- [ ] Integrate Lighthouse CI checks for performance, SEO, and practices tracking.
- [ ] Automate accessibility audits using axe-core tools in CI.

### Phase 5 — Next.js App Router Migration
- [ ] Migrate the project configuration from Vite client SPA to Next.js App Router.
- [ ] Restructure all layouts and routes to Next.js file-based routing (`/app`).
- [ ] Implement React Server Components (RSC) to handle heavy TMDB data fetching, drastically reducing client-side JavaScript bundle sizes.

### Phase 6 — AI-native Layer
- [ ] Build a standalone Model Context Protocol (MCP) Server.
- [ ] Implement specialized AI agents (Search, Orchestrator, Quality) using the Vercel AI SDK and Gemini integrations.
- [ ] Implement semantic query caching and native natural-language search discovery.

### Phase 7 — Premium UI Polish
- [ ] Apply an "Immersive Minimalism" design system with fluid grid layouts.
- [ ] Add backdrop glassmorphism styling, clean micro-interactions, and motion transition animations.
- [ ] Create refined skeleton loading visualizers and custom visual error boundaries.

---

## 8. Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher recommended)
- npm (v9.0.0 or higher)

### Setup Instructions

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone <repository-url>
   cd movie-explorer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your local environment file:
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and insert your TMDB API v3 key:
   ```env
   VITE_TMDB_API_KEY=your_actual_api_key_here
   ```

4. Start the local development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

---

## 9. Environment Variables

The project utilizes the following variables:

- `VITE_TMDB_API_KEY`: TMDB v3 API authentication key. Used by the Axios HTTP client. 
  *(Caution: Currently compiled directly into the client bundle).*

---

## 10. Available Scripts

The following scripts are defined in `package.json`:

- `npm run dev`: Starts the Vite development server locally with Hot Module Replacement (HMR).
- `npm run build`: Compiles TypeScript files and runs the production Vite bundler to output static assets to `dist/`.
- `npm run preview`: Launches a local server to preview the built application in `dist/`.
- `npm run lint`: Runs ESLint over all source files to verify code quality. *(Currently failing).*
- `npm run test`: Runs the Vitest unit testing suites.

---

## 11. Testing

Unit tests are written using **Vitest** and **React Testing Library**. To execute the test suite once, run:

```bash
npx vitest run
```

To run tests in interactive watch mode, run:
```bash
npm run test
```

Current test suites cover:
- **Navigation Links**: Ensures `Header` links resolve and render correctly.
- **Card Interactive Integrity**: Verifies watchlist toggling works on `MovieCard` without initiating page navigation.
- **Context Integrity**: Ensures `WatchlistContext` correctly updates local state and syncs to browser storage.

---

## 12. Accessibility Status

- **Status**: **Non-compliant** (WCAG 2.1 AA Target)
- **Known Violations**:
  - **Focus Trap / Navigation Flow**: The watchlist button is nested inside an anchor link in `MovieCard.tsx`, violating keyboard focus sequences.
  - **Screen Reader Labels**: The main search input lacks explicit aria-labels or semantic label associations.
  - **Internationalization**: Document language is hardcoded to English (`<html lang="en">`) while site content is Portuguese, breaking screen-reader voice synthesizers.
  - **ARIA Roles**: The loading spinner does not report its loading status to screen readers.

---

## 13. Security Status

- **Status**: **Unsecured Client Architecture**
- **Identified Exposures**:
  - **API Key Leak**: `VITE_TMDB_API_KEY` is loaded client-side and sent directly as a query parameter in browser-initiated HTTP requests, exposing it to any user inspection of the Network tab or JS bundles.
  - **Window Hijacking**: External official website links lack full `rel="noopener noreferrer"` parameters, exposing users to tabnabbing vulnerabilities.

---

## 14. Future Architecture

Once migrated to Next.js App Router and integrated with the AI-native layers, the target system architecture will flow securely as follows:

```
[ Client Browser ]
      │
      │ (Secure Next.js Routes / Session Auth)
      ▼
[ Next.js Server / App Router ]
  ├── React Server Components (RSC)
  ├── Route Handlers (API Proxy) ──> [ Hides TMDB API Key ]
  ├── Semantic Cache
  └── Vercel AI SDK Integration
        │
        ├── (Secure Server Fetching) ──> [ TMDB API Server ]
        │
        └── (Secure Agent Communication)
              ▼
   [ Standalone MCP Server ]
     ├── Quality Agent
     ├── Search Agent
     └── Discovery Orchestrator
```

---

## 15. Next Steps

1. **Phase 1 Execution**: Reorganize component structure and hook initialization inside `MovieDetailsPage` and `WatchlistContext.tsx` to fix ESLint errors.
2. **Phase 2 Refactoring**: Resolve the nested button issue in `MovieCard` and adjust the HTML `lang` tags to ensure accessibility baseline.
3. **Phase 3 Server-Side Proxying**: Setup server-side api proxy routes to eliminate the exposed `VITE_TMDB_API_KEY` vulnerability.
