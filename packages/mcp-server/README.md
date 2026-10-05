# Standalone MCP Server for Movie Explorer

Independent Node.js runtime exposing five TMDB tools through **Streamable HTTP**. It has its own dependencies, build, tests, Dockerfile, and deployment lifecycle; it is not embedded in Next.js.

**Status:** Phase 6.1 foundation, 6.2 tools, 6.3 Next.js server-only adapter, and deterministic 6.4 Search Agent are implemented. The executor is in `../../src/server/agents/search-agent.ts`; it accepts a validated tool plan and returns normalized results but does not use an LLM. Existing movie pages still use their original Server Actions. Quality/Safety, Orchestrator, and conversational UI are pending.

## Local Setup

Use Node.js 22.13+ on the 22.x line or Node.js 24+. Node.js 20.19+ also satisfies the current tooling requirements on the 20.x line used by CI/Docker.

From the repository root:

```bash
cd packages/mcp-server
npm ci
cp .env.example .env
```

Fill in `TMDB_API_KEY` and `MCP_INTERNAL_API_KEY` in this package's `.env`. Generate a shared credential locally, for example:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Store the generated value only in local files or deployment secret stores. Use the same credential in the Next.js server configuration.

The server reads `process.env` and does **not** automatically load `.env`. Start it with explicit environment loading (commands below run inside `packages/mcp-server`):

```bash
node --env-file=.env --import=tsx --watch src/index.ts
```

Alternatively, `npm run dev` works when the variables are already exported or injected by your process manager. The root `npm run mcp:dev` wrapper has the same requirement.

## Environment Variables

| Variable | Requirement / default |
|---|---|
| `TMDB_API_KEY` | Required, non-empty TMDB API key. |
| `MCP_INTERNAL_API_KEY` | Required, shared Bearer secret of at least 32 characters. |
| `NODE_ENV` | `development` by default; supports `production` and `test`. |
| `MCP_HOST` | `127.0.0.1` locally; Docker sets `0.0.0.0`. |
| `MCP_PORT` | `3001` by default. |
| `MCP_ALLOWED_ORIGINS` | Optional comma-separated exact origins, without paths, query strings, fragments, or credentials. |

If a request supplies an `Origin` header, it must match the allowlist; an empty allowlist rejects such requests. Server-to-server requests without an Origin header are permitted after authentication. This is not a browser integration or a substitute for authentication.

Next.js uses server-only `MCP_SERVER_URL` (default `http://127.0.0.1:3001/mcp`) and `MCP_INTERNAL_API_KEY`. Never prefix these or TMDB credentials with `NEXT_PUBLIC_` or `VITE_`.

## HTTP Endpoints

| Endpoint | Behavior |
|---|---|
| `POST /mcp` | Authenticated MCP requests using `Authorization: Bearer <MCP_INTERNAL_API_KEY>`. Stateless, request-scoped transport. |
| Other methods on `/mcp` | `405 Method Not Allowed`; no GET stream or session DELETE endpoint. |
| `GET /health` | Liveness response: `{ "status": "ok" }`. No authentication. |
| `GET /ready` | `{ "status": "ready" }`, or HTTP 503 during shutdown. No authentication. |

Readiness does not probe TMDB or validate live upstream credentials. Health responses do not expose configuration or secrets.

```bash
curl --fail http://127.0.0.1:3001/health
curl --fail http://127.0.0.1:3001/ready
```

Use the MCP SDK client for protocol initialization and tool calls. No stdio or legacy HTTP+SSE transport is provided.

## Implemented Tools

| Tool | Input | Result |
|---|---|---|
| `search_movies` | `query` (1–100 trimmed characters), optional integer `page` (1–500, default 1) | Movie summaries and `total_pages`. |
| `get_movie_details` | Numeric-string `movieId` | Normalized summary fields, plus genres/runtime when available. |
| `get_recommendations` | Numeric-string `movieId` | Up to 20 recommendations from the first page. |
| `get_trending` | Optional `window`: `day` or `week` (default `day`) | Up to 20 trending movies from the first page. |
| `get_credits` | Numeric-string `movieId` | Movie ID, up to 10 cast members, and director or `null`. |

Successful tool payloads are JSON serialized inside MCP text content. They are not presentation-ready UI DTOs: consumers must parse and validate them, handle MCP errors, and apply Quality/Safety approval before future AI rendering. Inputs and selected upstream fields are validated with Zod; unknown upstream fields are stripped.

These tools do not yet cover popular movie lists, trailers, or trending pagination used by the current Next.js UI. Do not remove its existing TMDB actions until the migration contracts preserve those features.

## Verification and Build

Inside this package:

```bash
npm run verify
```

This runs lint → typecheck → tests → build. Individual scripts are `lint`, `typecheck`, `test`, `test:watch`, and `build`. Tests mock TMDB and do not require live secrets.

From the repository root, use `npm run mcp:verify` or the `mcp:lint`, `mcp:typecheck`, `mcp:test`, and `mcp:build` wrappers.

Local verification on **2026-10-05**: lint, typecheck, all **42 tests**, and build passed. Docker runtime and production deployment were not verified in that run.

To start the compiled server from this package:

```bash
npm run build
node --env-file=.env dist/index.js
```

`npm run start` runs the same built entry point when environment variables are already supplied.

## Docker (Build Context Fix Pending)

The intended build context is this package directory, not the repository root:

```bash
docker build -t movie-explorer-mcp:latest .
```

**Known blocker:** the current `.dockerignore` excludes `src`, `tsconfig.json`, and `tsup.config.ts`, while the Dockerfile runs `npm run build` inside its builder stage. Align the build context before expecting this command to succeed; a host-side build alone does not fix the missing source/configuration inside Docker.

The Dockerfile defines a non-root distroless runner with port 3001 and `MCP_HOST=0.0.0.0`. Inject `TMDB_API_KEY` and `MCP_INTERNAL_API_KEY` at runtime. Keep the endpoint private where possible and use HTTPS for remote connections. MCP must be deployed separately from the Next.js Vercel application; the container hosting provider is still awaiting approval. Root CI checks this package's lint/types/tests/build, but does not build or run its Docker image.

## Remaining Work

- Close production, hosting, AI credential, and model-selection gates in [the execution plan](../../.ai/PLAN.md).
- Harden the Next.js adapter for redirect rejection, concurrent initialization, and failure recovery.
- Implement Quality/Safety → Orchestrator, validated streaming, limits, caching, and observability; review the pending 6.0 gates before production integration.
- Fix the Docker build context, then verify the image build/runtime and remote deployment.
- Verify real Next.js-to-MCP tool execution.
- Resolve UI contract coverage before retiring duplicate server-side TMDB access.

Architecture: [`.ai/ARCHITECTURE.md`](../../.ai/ARCHITECTURE.md). Tool specification: [`.ai/MCP_INTERFACE.md`](../../.ai/MCP_INTERFACE.md). Application setup: [root README](../../README.md).
