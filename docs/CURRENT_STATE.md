# Movie Explorer — Current State Audit

## 1. Executive Summary

This document presents a comprehensive audit of the current state of the **Movie Explorer** project. 

While the strategic goals and documentation might refer to a highly optimized, production-ready, AI-driven stack (including React 19, Next.js App Router, Server Components, standalone MCP servers, and full WCAG 2.1 AA compliance), the **actual codebase** is a client-side Single Page Application (SPA) built with Vite, React (version 19), React Router DOM (version 7), and Tailwind CSS.

Critical findings from this audit include:
- **Security Vulnerability**: The TMDB API key is loaded on the client side and exposed directly in network requests, making it trivial for any user to inspect and copy it.
- **Code Quality Issues (Linter Failures)**: The build succeeds, but `npm run lint` fails with **7 distinct errors**, including a severe **React Hooks rule violation** (conditional hook call) on the movie details page, unused variables in async hooks, and issues with Fast Refresh compatibility.
- **Accessibility (a11y) Violations**: Major accessibility issues exist, such as nested interactive elements (a button inside an anchor link in the Movie Card), missing input labels, language mismatch (`html lang="en"` vs. Portuguese content), and spinners lacking ARIA roles.
- **Missing DevOps/CI/CD**: There are no Dockerfiles, GitHub Actions, or CI configuration files.
- **Missing Roadmap Items**: AI features, MCP server integrations, and Next.js migration targets are completely absent in the active code.

---

## 2. Confirmed Current Stack

- **Framework**: Vite (v7.2.4) client-only SPA (No Next.js)
- **React version**: React v19.2.0 & React DOM v19.2.0
- **Routing**: React Router DOM (v7.9.6) client-side routing (`createBrowserRouter`)
- **Styling**: Tailwind CSS (v3.4.18) & PostCSS (v8.5.6)
- **Data fetching**: Client-side fetching using Axios (v1.13.2) wrapped inside `useEffect` hook wrappers
- **State management**: React Context (`WatchlistContext.tsx`) + `localStorage` for watchlist persistence
- **Testing**: Vitest (v4.0.16) + React Testing Library (v16.3.1) + jsdom (v27.4.0)
- **DevOps**: None implemented (No Docker, no CI/CD workflows)
- **AI/MCP**: None implemented (0% AI or MCP code present)

---

## 3. Implemented Features

- **Home Page (`src/pages/Home/index.tsx`)**:
  - Displays popular movies or trending movies (toggleable by day or week).
  - Search functionality with a client-side 500ms debounce.
  - Page-by-page client-side pagination (Previous / Next buttons).
  - Loading skeleton state using `MovieCardSkeleton`.
- **Movie Details Page (`src/pages/MovieDetails/index.tsx`)**:
  - Displays detailed metadata (rating, runtime, release date, director, genres, overview).
  - Integrates a YouTube trailer player using an responsive iframe.
  - Renders a main cast list (up to 10 members) and a row of similar movies.
  - Includes an "Add to / Remove from Watchlist" button.
- **Watchlist Page (`src/pages/Watchlist/index.tsx`)**:
  - Renders all movies currently saved in the watchlist.
- **Watchlist Context (`src/context/WatchlistContext.tsx`)**:
  - Uses React Context to share state across components and syncs state to `localStorage` (key: `movie-explorer:watchlist`).
- **Header (`src/components/Header.tsx`)**:
  - Sticky navigation bar containing navigation links ("Início" and "Watchlist") with active path highlighting via `NavLink`.
- **Unit Tests**:
  - Three simple Vitest test suites checking navigation links in `Header`, movie rendering in `MovieCard`, and toggle capability in `WatchlistContext`.

---

## 4. Target Features Not Yet Implemented

The following features/configurations are mentioned in the strategy roadmap or documentation but **do not exist** in the active codebase:
1. **Next.js App Router Migration**: The project is entirely a SPA. No `/app` directory, React Server Components (RSC), or Server Actions are present.
2. **Server-Side TMDB API Execution**: All requests go directly from the user's browser to TMDB, leaving the API key exposed.
3. **AI SDK & Multi-Agent Systems**: There are no references to Vercel AI SDK, MCP servers, or multi-agent orchestrations.
4. **DevOps & CI/CD Pipelines**: No `Dockerfile`, `.dockerignore`, `.github/workflows/`, Lighthouse CI, or axe-core pipelines.
5. **Advanced Search Filters**: Filters for genre, release year, or sorting order are not implemented on the Home page.
6. **WCAG 2.1 AA Compliance**: The application violates multiple critical WCAG guidelines.

---

## 5. Architecture Findings

- **Client-Side Async Bottlenecks (Waterfalls)**:
  - In `MovieDetailsPage`, four TMDB API endpoints (`fetchMovieDetails`, `fetchMovieVideos`, `fetchMovieCredits`, `fetchSimilarMovies`) are fetched on the client side using `Promise.all` inside `useMovieDetails.ts`. While parallelized, it blocks page rendering on the client and is highly dependent on client-side network latency.
- **Vite SPA Structure**:
  - Traditional Single Page Application architecture. If the initial bundle grows, initial page load performance will degrade. There is no route-based code splitting (e.g. `React.lazy` or dynamic imports).
- **State Initialization Antipattern**:
  - In `WatchlistContext.tsx`, `watchlist` state is initialized as an empty array, and then populated asynchronously inside a `useEffect` reading from `localStorage`. Simultaneously, a second `useEffect` writes `watchlist` back to `localStorage` whenever it changes. On initial mount, this can lead to race conditions where the empty array is temporarily written to `localStorage` before the parsed array is set, or at minimum leads to unnecessary cascading renders.

---

## 6. Security Findings

- **Exposed TMDB API Key (Critical)**:
  - The API key is initialized via `const apiKey = import.meta.env.VITE_TMDB_API_KEY;` in `src/services/tmdb.ts`. Since the request is made on the client side directly to `https://api.themoviedb.org/3`, the key is embedded into the client bundle and sent as a query parameter (`api_key`) in every browser request. Anyone viewing the browser DevTools "Network" tab or inspecting the production js bundle can extract it instantly.
- **Link Security**:
  - The official website link (`a` tag in `MovieDetails`) uses `target="_blank"` with `rel="noreferrer"`. It is recommended to use `rel="noopener noreferrer"` to guarantee protection against reverse tabnabbing on all browsers.

---

## 7. Accessibility Findings

| Issue | Severity | File | Recommendation |
|---|---|---|---|
| **Nested Interactive Elements** | High | [MovieCard.tsx](file:///home/luis/Lm/projects/movie-explorer/src/components/MovieCard.tsx#L18-L57) | The Watchlist toggle `<button>` is nested inside the `<Link>` container. Nesting interactive elements is an HTML specification violation. It breaks keyboard focus sequences and screen reader navigation. Remove the button from the link hierarchy (e.g., place it outside the link in a container). |
| **Missing Search Input Label** | High | [Home/index.tsx](file:///home/luis/Lm/projects/movie-explorer/src/pages/Home/index.tsx#L241-L248) | The search input element has no `<label>` or `aria-label` associated with it. Screen readers cannot describe the input's purpose. Add `aria-label="Buscar filmes"` or a matching `<label>`. |
| **HTML Language Code Mismatch** | Medium | [index.html](file:///home/luis/Lm/projects/movie-explorer/index.html#L2) | The root tag specifies `<html lang="en">`, but all text in the app is in Portuguese (pt-BR). Assistive technologies will try to read the Portuguese text using English pronunciation. Update to `<html lang="pt-BR">`. |
| **Spinner Lacks ARIA Role** | Medium | [LoadingSpinner.tsx](file:///home/luis/Lm/projects/movie-explorer/src/components/LoadingSpinner.tsx#L1-L7) | The loading spinner is a decorative div. Screen readers will not announce that content is loading. Add `role="status"` and `aria-label="Carregando dados"` to the element. |
| **Interactive Toggles Lack ARIA State** | Medium | [Home/index.tsx](file:///home/luis/Lm/projects/movie-explorer/src/pages/Home/index.tsx#L96-L143) | The buttons for switching between "Populares" / "Trending" and "Hoje" / "Semana" do not indicate which option is currently active to assistive technology. Add `aria-pressed={viewMode === 'popular'}` (or similar) to indicate selection state. |
| **Missing Skip Link** | Low | [App.tsx](file:///home/luis/Lm/projects/movie-explorer/src/App.tsx) | Keyboard users must tab through the navigation links on every page load to reach the main content. Add a "Skip to Main Content" (`pular para o conteúdo principal`) anchor at the top of the body layout. |
| **External Fonts Configured But Not Loaded** | Low | [index.html](file:///home/luis/Lm/projects/movie-explorer/index.html) | `tailwind.config.js` defines `"Space Grotesk"` and `"Inter"` as primary fonts, but they are not loaded via HTML `<link>` or CSS imports, causing the browser to fall back to default sans-serif. Load them from Google Fonts. |

---

## 8. Code Quality Findings

| Area | Finding | Impact | Recommendation |
|---|---|---|---|
| **Rules of Hooks** | Conditional hook execution in [MovieDetails/index.tsx](file:///home/luis/Lm/projects/movie-explorer/src/pages/MovieDetails/index.tsx#L24) | **High**. Hook `useWatchlist` is called on line 24, which is *after* early returns on lines 19 and 20. This violates React's rules and can cause React to crash due to mismatched hooks calls order. | Move the `useWatchlist` call to the top of the component (e.g. line 18) before any early returns. |
| **Fast Refresh** | Context & exports in same file [WatchlistContext.tsx](file:///home/luis/Lm/projects/movie-explorer/src/context/WatchlistContext.tsx#L16-L56) | **Medium**. ESLint error `react-refresh/only-export-components`. Non-component exports alongside React components breaks HMR (Hot Module Replacement) refresh. | Move context creation (`WatchlistContext`), Provider, and the helper hook (`useWatchlist`) to separate files or restructure exports. |
| **State Synchrony** | Synchronous setState in useEffect [WatchlistContext.tsx](file:///home/luis/Lm/projects/movie-explorer/src/context/WatchlistContext.tsx#L28) | **Medium**. ESLint error `react-hooks/set-state-in-effect`. Synchronously updating local state inside `useEffect` causes extra render cycles. | Use lazy state initialization: `const [watchlist, setWatchlist] = useState<MovieListItem[]>(() => { ... })` and return parsed localStorage data. |
| **Unused Variables** | Unused `err` variables in Catch Blocks | **Low**. ESLint errors `@typescript-eslint/no-unused-vars` in `useMovieDetails.ts` (L67), `useMovies.ts` (L38), `useTrendingMovies.ts` (L34). | Change `catch (err) {` to `catch {` since the error object is not utilized. |

---

## 9. Testing & DevOps Findings

- **No DevOps Infrastructure**:
  - The repo lacks all requested DevOps configurations. There are no Docker files (`Dockerfile`, `.dockerignore`) and no GitHub Action workflows.
- **Incomplete Test Coverage**:
  - While Vitest tests exist and pass, they only cover 3 basic scenarios (verifying menu link labels, the watchlist local state hook container, and simple card rendering).
  - There are **no unit tests** for services (`tmdb.ts`), individual pages (`Home`, `MovieDetails`), or custom data-fetching hooks (`useMovies`, `useTrendingMovies`, `useMovieDetails`).

---

## 10. Migration Readiness

- **Partially Ready**

### Justification
1. **React 19 Compatibility**: The dependencies are already on React 19 (`^19.2.0`), so core APIs are present.
2. **TypeScript Strictness**: TypeScript is configured with `"strict": true` which is optimal.
3. **Migration Roadblocks**:
   - The Direct client-to-TMDB data fetching must be rewritten. To secure the API key, TMDB fetching logic must be moved to Server-Side endpoints (e.g., Next.js Route Handlers or Server Components).
   - Code stability must be achieved first: the current React Hook violation in `MovieDetails/index.tsx` and context effects must be refactored to prevent runtime crashes.
   - Client routing (`react-router-dom`) must be mapped to file-based routing (`/app` structure in Next.js).

---

## 11. Recommended Next Step

1. **Fix Critical React Hook Violation & ESLint Errors**: Move `useWatchlist` above early returns in `MovieDetailsPage` and clean up unused variables in catch blocks to get `npm run lint` passing.
2. **Refactor Watchlist State Initialization**: Use a lazy initializer function in `useState` inside `WatchlistContext.tsx` to read from `localStorage` once, avoiding extra render cycles.
3. **Address Top Accessibility Issues**:
   - In `MovieCard.tsx`, extract the watchlist toggle button outside the parent `<Link>` to fix keyboard focus.
   - Add `aria-label` to the search input in `Home/index.tsx`.
   - Set `<html lang="pt-BR">` in `index.html`.
4. **Transition plan to Next.js / Server-Side TMDB consumption**: Implement an API route or server-side fetch wrappers to hide `VITE_TMDB_API_KEY` from client-side network calls.

---

## 12. Verification Commands

Below is the log of executed commands and their outcomes:

### 1. `npm install`
- **Status**: SUCCESS
- **Result**: Successfully resolved and downloaded 402 packages.
- **Output Snippet**:
  ```
  added 46 packages, changed 9 packages, and audited 402 packages in 3s
  14 vulnerabilities (6 moderate, 7 high, 1 critical)
  ```

### 2. `npm run lint`
- **Status**: FAILED (Exit Code 1)
- **Result**: 7 lint errors detected.
- **Details**:
  - `src/context/WatchlistContext.tsx` (3 errors): Fast refresh rules, synchronous setState in effect.
  - `src/hooks/useMovieDetails.ts` (1 error): Unused `err` variable in catch block.
  - `src/hooks/useMovies.ts` (1 error): Unused `err` variable in catch block.
  - `src/hooks/useTrendingMovies.ts` (1 error): Unused `err` variable in catch block.
  - `src/pages/MovieDetails/index.tsx` (1 error): Hook `useWatchlist` called conditionally.

### 3. `npm run typecheck`
- **Status**: FAILED (Exit Code 1)
- **Result**: Command not found in scripts.
- **Details**:
  - The script does not exist in `package.json`. However, typechecking is executed as part of `npm run build` using `tsc -b`.

### 4. `npm run test` (via `npx vitest run`)
- **Status**: SUCCESS
- **Result**: 3/3 tests passed.
- **Details**:
  ```
  ✓ src/components/__tests__/Header.test.tsx (1 test) 133ms
  ✓ src/context/__tests__/WatchlistContext.test.tsx (1 test) 132ms
  ✓ src/components/__tests__/MovieCard.test.tsx (1 test) 131ms
  
  Test Files  3 passed (3)
  Tests       3 passed (3)
  ```

### 5. `npm run build`
- **Status**: SUCCESS
- **Result**: Compiles using `tsc -b` and builds production bundle using Vite without error.
- **Output Snippet**:
  ```
  dist/index.html                   0.46 kB │ gzip:   0.29 kB
  dist/assets/index-BjlWD1Ss.css   17.38 kB │ gzip:   3.99 kB
  dist/assets/index-DlvdjGvQ.js   332.83 kB │ gzip: 107.61 kB
  ✓ built in 1.26s
  ```
