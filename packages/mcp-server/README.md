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
| `MCP_PORT` | Optional explicit port; overrides the platform `PORT`. Defaults to `PORT` when supplied, otherwise `3001` locally. |
| `PORT` | Optional platform-assigned port (Render supplies this for web services). |
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

Local verification on **2026-10-05**: lint, typecheck, all **45 tests**, and build passed. A Docker build was attempted but could not access the local Docker daemon (`/var/run/docker.sock` permission denied); image/runtime and Render deployment remain unverified.

To start the compiled server from this package:

```bash
npm run build
node --env-file=.env dist/index.js
```

`npm run start` runs the same built entry point when environment variables are already supplied.

## Docker and Render Deployment

The intended Docker build context is this package directory, not the repository root:

```bash
cd packages/mcp-server
docker build -t movie-explorer-mcp:latest .
```

The `.dockerignore` omits generated/development files but keeps `src`, `tsconfig.json`, and `tsup.config.ts`, which the builder needs. The container listens on `MCP_PORT`, or Render's assigned `PORT`; local default remains `3001`. It binds to `0.0.0.0` in Docker and exposes port `10000` for Render.

### Render Dashboard Settings

Create a **Web Service** from the repository with:

| Setting | Value |
|---|---|
| Runtime | Docker |
| Root Directory | `packages/mcp-server` |
| Dockerfile Path | `Dockerfile` (relative to the root directory) |
| Docker Build Context | `.` (the package root) |
| Health Check Path | `/health` |
| Plan | Free for a demo; see cold-start caveat below |

Add these environment variables to the Render service. Enter secrets directly in its dashboard; do not commit them:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `TMDB_API_KEY` | TMDB key |
| `MCP_INTERNAL_API_KEY` | At least 32 random characters; use the exact same value in Vercel |
| `MCP_HOST` | `0.0.0.0` |
| `MCP_ALLOWED_ORIGINS` | Exact Vercel origin, e.g. `https://your-app.vercel.app`; no wildcard |

Render supplies `PORT` automatically. Do not set `MCP_PORT` unless you intentionally want to override it. After deployment, test `https://<render-service>.onrender.com/health` and `/ready`; the MCP endpoint is `https://<render-service>.onrender.com/mcp`.

Then, in Vercel → Project → Settings → Environment Variables, set `MCP_SERVER_URL` to the HTTPS `/mcp` URL and `MCP_INTERNAL_API_KEY` to the same secret configured in Render. These values prepare the server-only adapter; the current movie UI does not yet call the MCP/Search Agent.

**Free plan caveat:** Render spins down a free web service after 15 minutes without inbound traffic; waking it can take about a minute. This is suitable for a demo, but the first Vercel-to-MCP call after idle may time out. Verify this before treating the free deployment as production-ready.

The image uses a non-root distroless runner. Keep remote traffic on HTTPS and never expose the bearer key to browser code. Root CI checks this package's lint/types/tests/build but does not build or run its Docker image.

## Remaining Work

- Close production, AI credential, and model-selection gates in [the execution plan](../../.ai/PLAN.md).
- Harden the Next.js adapter for redirect rejection, concurrent initialization, and failure recovery.
- Implement Quality/Safety → Orchestrator, validated streaming, limits, caching, and observability; review the pending 6.0 gates before production integration.
- Verify the Render Docker build/runtime and remote deployment, including free-tier cold starts.
- Verify real Next.js-to-MCP tool execution.
- Resolve UI contract coverage before retiring duplicate server-side TMDB access.

Architecture: [`.ai/ARCHITECTURE.md`](../../.ai/ARCHITECTURE.md). Tool specification: [`.ai/MCP_INTERFACE.md`](../../.ai/MCP_INTERFACE.md). Application setup: [root README](../../README.md).
