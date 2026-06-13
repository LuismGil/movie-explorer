.
├── .ai
│   ├── ARCHITECTURE.md
│   ├── CONTEXT.md
│   ├── MCP_INTERFACE.md
│   ├── PLAN.md
│   ├── RULES.md
│   ├── SECURITY.md
│   ├── SPEC.md
│   └── TASK.md
├── app
│   ├── layout.tsx
│   ├── page.tsx
│   ├── movie
│   │   └── [id]
│   │       └── page.tsx
│   └── watchlist
│       └── page.tsx
├── docs
│   ├── ANATOMY.md
│   └── ui_ux_principles_design_guide.html
├── .github
│   └── workflows
│       └── ci.yml
├── scripts
│   └── a11y-audit.js
├── shared
│   └── tokens
│       ├── colors.json
│       ├── components.json
│       ├── elevation.json
│       ├── gradients.json
│       ├── grid.json
│       ├── radii.json
│       ├── spacing.json
│       └── typography.json
├── src
│   ├── components
│   │   ├── __tests__
│   │   │   ├── Header.test.tsx
│   │   │   └── MovieCard.test.tsx
│   │   ├── CastList.tsx
│   │   ├── ErrorState.tsx
│   │   ├── Header.tsx
│   │   ├── InfoChip.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── MovieCardSkeleton.tsx
│   │   ├── MovieCard.tsx
│   │   ├── MovieGrid.tsx
│   │   ├── PaginationBar.tsx
│   │   ├── SearchBar.tsx
│   │   ├── SimilarMovies.tsx
│   │   ├── TrailerPlayer.tsx
│   │   └── WatchlistToggle.tsx
│   ├── context
│   │   ├── __tests__
│   │   │   └── WatchlistContext.test.tsx
│   │   ├── WatchlistContext.ts
│   │   └── WatchlistProvider.tsx
│   ├── i18n
│   │   ├── index.ts
│   │   └── messages.ts
│   ├── server
│   │   └── actions
│   │       └── tmdb.ts
│   ├── test
│   │   └── setup.ts
│   ├── types
│       ├── index.ts
│       └── movie.ts
│   ├── index.css
├── Dockerfile
├── .dockerignore
├── eslint.config.js
├── .gitignore
├── lighthouserc.json
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.js
├── README.md
├── tailwind.config.js
├── tsconfig.json
└── vitest.config.ts

24 directories, 55 files

## TypeScript Path Aliases

The project configuration defines a path alias in [tsconfig.json](file:///home/luis/Lm/projects/movie-explorer/tsconfig.json):
- `@/*` -> `./src/*`

Use this alias for importing components, contexts, types, utility libraries, actions, etc. from the `src/` directory.

Example:
```typescript
import SimilarMovies from "@/components/SimilarMovies";
import { messages } from "@/i18n";
import { getMovieDetails } from "@/server/actions/tmdb";
```

Keep relative imports (`./` or `../`) only for:
- Nearby local files within the same subfolder
- CSS imports
- Framework specific conventions
