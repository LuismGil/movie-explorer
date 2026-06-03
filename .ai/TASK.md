## Phase 1 — Stabilization & Code Quality

> **Goal**: Zero ESLint errors, zero TypeScript compiler errors, clean hooks, scripts ready for CI.

### Tasks

- [ ] **1.1** Run `npm run lint` and document every error/warning in a scratch list. Do not fix yet — inventory first.
- [ ] **1.2** Fix all ESLint errors. Priority order: `react-hooks/rules-of-hooks` violations → `no-unused-vars` → remaining warnings.
- [ ] **1.3** Resolve the React Hooks rule violation in `MovieDetailsPage` (hooks called conditionally or after early returns).
- [ ] **1.4** Refactor `WatchlistContext.tsx`: replace eager `useState(JSON.parse(localStorage…))` with lazy initializer `useState(() => JSON.parse(…))` to prevent SSR hydration mismatch.
- [ ] **1.5** Add `"typecheck": "tsc --noEmit"` to `package.json` scripts.
- [ ] **1.6** Run `npm run typecheck` — fix all type errors until exit code 0.
- [ ] **1.7** Reduce `Home/index.tsx` from 347 lines: extract `<MovieGrid>`, `<PaginationBar>`, and `<SearchBar>` as standalone components. Each file must be < 150 lines after extraction.
- [ ] **1.8** Replace the 14-item `useMemo` dependency array with a properly scoped derived computation or split into smaller memos. (These will be removed entirely in Phase 5, but must not cause bugs now.)

### Phase 1 Verification
```bash
npm run lint        # exit 0, zero errors
npm run typecheck   # exit 0, zero errors
npm run test        # all existing tests pass
```
**Commit**: `fix: stabilize codebase — lint, typecheck, hooks, context refactor`

---