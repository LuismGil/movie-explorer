## Phase 2 — Accessibility Baseline (WCAG 2.1 AA)

> **Goal**: Zero `axe-core` critical/serious violations. Full keyboard and screen-reader support.

### Tasks

- [x] **2.1** Extract the watchlist `<button>` from inside the `<Link>` wrapper in `MovieCard.tsx`. Use CSS `position: absolute; z-index: 10` on the button and `position: relative` on the card container so both elements are siblings in the DOM but visually overlapping.
- [x] **2.2** Add `focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none` to every interactive element in the card (the `<Link>` and the watchlist `<button>`).
- [x] **2.3** Add `aria-hidden="true"` to the `🎬` emoji span in `Header.tsx`.
- [x] **2.4** Add `aria-current="page"` to the active `<NavLink>` in `Header.tsx`. Use the `NavLink` `className` callback: `({ isActive }) => isActive ? "... aria-current" : "..."` — note this requires the `aria-current` prop, not the class. Set it conditionally: `aria-current={isActive ? "page" : undefined}`.
- [x] **2.5** Add `<label htmlFor="movie-search" className="sr-only">Search movies</label>` paired with `id="movie-search"` on the `<input>` inside the `SearchBar` component. Do NOT use only `aria-label` — a visible/hidden `<label>` is preferred for WCAG 2.1 SC 1.3.1.
- [x] **2.6** Add `aria-label={`Go to page ${page}`}` to each pagination `<button>` in `PaginationBar`.
- [x] **2.7** Add `role="status"` and `aria-live="polite"` to the spinner container in `LoadingSpinner.tsx`. Add a visually-hidden `<span className="sr-only">Loading…</span>` inside.
- [x] **2.8** Set `lang="pt-BR"` on the `<html>` element in `index.html`.
- [x] **2.9** Add a "Skip to Main Content" anchor as the very first child of `<body>` in `index.html`:
  ```html
  <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-sky-500 focus:text-white focus:rounded">
    Skip to Main Content
  </a>
  ```
  Add `id="main-content"` to the `<main>` element in the layout.
- [x] **2.10** Add `aria-pressed={isInWatchlist}` to all watchlist toggle buttons.
- [x] **2.11** Install `axe-core` and `@axe-core/react` as dev dependencies. Add a dev-mode automatic a11y overlay (axe runs in the browser console in development, not production).

### Phase 2 Verification
```bash
npm run lint        # exit 0
npm run typecheck   # exit 0
npm run test        # pass
# Manual: Tab through entire app — every interactive element must show a visible focus ring
# Manual: Run axe DevTools browser extension on Home, MovieDetail, Watchlist — 0 critical/serious
```
**Commit**: `fix(a11y): achieve WCAG 2.1 AA baseline — nested elements, ARIA, skip nav, lang`