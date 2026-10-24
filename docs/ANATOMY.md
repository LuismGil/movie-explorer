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
│   ├── api
│   │   ├── ai
│   │   │   └── search/route.ts
│   │   └── telemetry
│   │       └── tokens/route.ts
│   ├── movie
│   │   └── [id]
│   │       └── page.tsx
│   └── watchlist
│       └── page.tsx
├── docs
│   ├── ANATOMY.md
│   ├── DEPLOYMENT.md        # Deployment evidence, verification limits, and next steps
│   ├── AI_OPERATIONS.md     # Phase 6.8 cache, telemetry, and activation boundaries
│   ├── QUALITY_GATE.md      # Deterministic Quality/Safety contract and limitations
│   └── ui_ux_principles_design_guide.html
├── .github
│   └── workflows
│       └── ci.yml
├── scripts
│   ├── a11y-audit.js
│   ├── test-ai-rate-limit.ts # Isolated local Redis integration tests; no hosted credentials
│   └── verify-mcp-remote.ts # Opt-in server-only adapter check; never calls Google
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
├── packages
│   └── mcp-server/          # Standalone MCP Server package (Node.js/Express)
│       ├── src/             
│       │   ├── tmdb/        # Shared TMDB client, schemas, mapper, errors
│       │   ├── tools/       # MCP tool handlers (search-movies, get-movie-details, etc.)
│       │   ├── server/      # MCP Express Server logic
│       │   ├── config/      # Env validation
│       │   └── observability/# Structured logging
│       └── tests/           # Unit and Integration tests
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
│   │   ├── actions
│   │   │   └── tmdb.ts
│   │   ├── agents
│   │   │   ├── __tests__
│   │   │   │   ├── quality-agent.test.ts
│   │   │   │   └── search-agent.test.ts
│   │   │   ├── quality-agent.ts
│   │   │   ├── quality-agent.schemas.ts
│   │   │   ├── quality-agent.evidence.ts
│   │   │   ├── search-agent.schemas.ts
│   │   │   └── search-agent.ts
│   │   ├── env
│   │   │   └── mcp.ts
│   │   ├── ai
│   │   │   ├── search-handler.ts
│   │   │   ├── rate-limit.ts
│   │   │   └── rate-limit.script.ts
│   │   ├── mcp
│   │       └── client.ts
│   │   └── telemetry
│   │       └── ai-metrics.ts
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

## TypeScript Path Aliases

The project configuration defines a path alias in [tsconfig.json](../tsconfig.json):
- `@/*` -> `./src/*`

Use this alias for importing components, contexts, types, utility libraries, actions, etc. from the `src/` directory.

Note: By default, the path alias resolves within all source files and test files (including those in `__tests__` folders), as test exclusions have been removed from [tsconfig.json](../tsconfig.json).

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
