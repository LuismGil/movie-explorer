# Movie Explorer: Architecture & Structural Truth

This document defines the 2026 senior-level target architecture for Movie Explorer. It serves as the "structural truth" of the system. Any AI agent operating in this repository MUST read and adhere to these architectural guidelines before touching the code.

## 1. Frontend Topology (React 19 & Next.js)

The application is migrating from a traditional Vite SPA to a server-rendered architecture using Next.js App Router.

* **Server Components by Default:** Data-heavy pages are written as async React Server Components (RSC) to completely eliminate client-side data fetching waterfalls.
* **Client Boundaries:** The `"use client"` directive is reserved strictly for leaf nodes requiring interactivity.
* **Suspense & Streaming:** The UI utilizes `<Suspense>` boundaries to stream structural fragments to the client while parallel asynchronous data requests are resolved on the server.

## 2. Canonical Target Flow

The system implements the following target flow for AI interactions:

User
→ Next.js UI
→ server-side AI entry point
→ Orchestrator Agent
→ Search Agent
→ server-only MCP Client Adapter
→ standalone MCP Server
→ TMDB API
→ Quality/Safety Agent
→ validated structured result
→ accessible Streaming UI

* The Quality/Safety Agent must validate the complete result before final user-visible content reaches the UI.
* Progress events may be streamed only when they contain controlled application-defined status data.
* **Never stream:** raw model output; raw MCP responses; private prompts; chain-of-thought; tool arguments containing secrets; unvalidated Markdown or HTML.

## 3. Canonical Repository Boundaries

The target repository structure isolates the MCP server from the Next.js application (these paths are planned Phase 6.0 architecture only):

```
packages/
└── mcp-server/
    ├── src/
    │   ├── config/
    │   ├── server/
    │   ├── tools/
    │   ├── schemas/
    │   ├── tmdb/
    │   ├── observability/
    │   └── index.ts
    ├── tests/
    ├── package.json
    └── tsconfig.json

src/
└── server/
    └── ai/
        ├── agents/
        │   ├── orchestrator.ts
        │   ├── search.ts
        │   └── quality-safety.ts
        ├── mcp/
        │   └── client.ts
        ├── schemas/
        ├── services/
        └── config/
```

## 4. MCP Server Boundary

* **Current State:** Next.js currently owns the existing server-side TMDB integration.
* **Target State:** The MCP server is a standalone Node.js process. It has an independent package, build, test, start, Docker, and deployment lifecycle. It is not embedded in the Next.js application.
* React components must never import MCP server modules. Next.js must communicate with MCP through a server-only network client. The browser must never call the MCP server directly.
* The MCP server becomes the canonical owner of TMDB integration by the Phase 6 Definition of Done. Duplicate TMDB HTTP implementations must not remain in the final architecture. Existing server-side TMDB code must have an explicit migration and removal task. `TMDB_API_KEY` belongs only to the standalone MCP server after the migration is completed.

## 5. Canonical Transport

Use exactly one MCP transport: **Streamable HTTP**.

* MCP endpoint: `/mcp`
* Health endpoint: `/health`
* Readiness endpoint: `/ready`
* No stdio transport. No legacy HTTP+SSE transport. No custom transport. No separate local transport.
* Local development must also use Streamable HTTP.
* The server must bind to `127.0.0.1` by default locally.
* Production host and port must come from validated server-side environment variables.
* The MCP client must reject HTTP redirects.
* The server must validate allowed origins.
* The MCP endpoint must require authentication.
* Health endpoints must not expose secrets, configuration values, tool data, or dependency internals.

## 6. Deployment Boundary

* **Next.js application** → Vercel
* **Standalone MCP server** → Container-based managed service (separate container-capable Node.js hosting provider)

The MCP server must not be deployed inside the Next.js Vercel application.

**Decision Record:**
Comparing requirements (persistent Node.js HTTP process, Docker support, HTTPS, environment variables, health checks, predictable cold-start behavior, logs, Hobby/portfolio cost, deployment from GitHub), we recommend one deployment category: **Container-based managed service**.

## 7. Canonical MCP Authentication

Authentication Pattern: `Authorization: Bearer <MCP_INTERNAL_API_KEY>`

* `MCP_INTERNAL_API_KEY` is server-side only. Next.js sends it from the server-only MCP client. The browser never receives it.
* The MCP server validates it using constant-time comparison.
* Missing or invalid credentials return a generic unauthorized response. Authentication failures must not reveal whether the server, key, tool, or resource exists.
* The credential must never appear in logs. MCP URLs must not contain credentials. Do not use query-string authentication. Do not create an unauthenticated production MCP endpoint.

## 8. Canonical Environment Variables

Target server-side variables:

```env
# Next.js server
GOOGLE_GENERATIVE_AI_API_KEY=
MCP_SERVER_URL=
MCP_INTERNAL_API_KEY=

# Standalone MCP server
TMDB_API_KEY=
MCP_INTERNAL_API_KEY=
MCP_HOST=127.0.0.1
MCP_PORT=3001
MCP_ALLOWED_ORIGINS=
```

* Do not use `GOOGLE_AI_API_KEY`, `API_GOOGLE_KEY`, or `GEMINI_API_KEY` for the official `@ai-sdk/google` provider. The canonical Google provider variable is `GOOGLE_GENERATIVE_AI_API_KEY`.
* No AI, MCP, or TMDB secret may use a `NEXT_PUBLIC_` or `VITE_` prefix.

## 9. Canonical AI Provider

Target provider contract: Vercel AI SDK 6, `@ai-sdk/google`, Google Generative AI API.
The future model policy must define: default low-latency model, higher-reasoning model, fallback behavior, timeout, retry limit, token budget, maximum tool calls, structured-output validation, and provider failure behavior.

## 10. Agent Responsibilities

Freeze exactly three agents:

* **Orchestrator Agent:** Owns intent classification, execution planning, tool selection, agent sequencing, global timeout, tool-call budget, token budget, and final pipeline coordination. Must not call TMDB directly.
* **Search Agent:** Owns MCP tool execution, result aggregation, normalization, deduplication, preservation of TMDB IDs, partial failure handling, and structured search context. Must not render user-facing content. Must not call TMDB directly.
* **Quality/Safety Agent:** Owns factual validation against MCP-derived data, unsupported-claim rejection, contradiction detection, schema validation, sanitization, and final structured UI DTO approval. It is the only agent allowed to approve final user-visible AI data. Must not bypass schemas.

## 11. Canonical Data-Validation Rule

Every boundary must use explicit Zod schemas:
* User input → validated request schema
* Agent output → validated agent schema
* MCP tool input → validated tool input schema
* MCP tool output → validated tool output schema
* UI result → validated presentation DTO schema

TypeScript types must be inferred from schemas where applicable. Do not maintain duplicated manual interfaces and Zod schemas for the same contract. Unknown properties must be rejected or stripped according to one documented global policy. Raw provider text must never be treated as trusted structured data. MCP responses must not be passed directly to React components.

## 12. Canonical MCP Tools

Exactly five Phase 6 tools: `search_movies`, `get_movie_details`, `get_recommendations`, `get_trending`, `get_credits`.

## 13. UI Governance (Immersive Minimalism) & Accessibility

* **Design System:** Follows "Immersive Minimalism", relying on design tokens (located in `shared/tokens/`), high-contrast dark surfaces, and "glassmorphic" depth (`.glass`).
* **WCAG 2.1 AA Compliance:** Strict accessibility adherence.
