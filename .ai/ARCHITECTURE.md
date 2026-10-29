# Movie Explorer: Architecture & Structural Truth

This document records the current and approved target architecture for Movie Explorer. It serves as the structural truth of the system. Any AI agent operating in this repository MUST read and adhere to these architectural guidelines before touching the code.

## 1. Frontend Topology (React 19 & Next.js)

The application has migrated from a traditional Vite SPA to a server-rendered architecture using Next.js App Router.

* **Server Components by Default:** Data-heavy pages are written as async React Server Components (RSC) to completely eliminate client-side data fetching waterfalls.
* **Client Boundaries:** The `"use client"` directive is reserved strictly for leaf nodes requiring interactivity.
* **Suspense & Streaming:** The UI utilizes `<Suspense>` boundaries to stream structural fragments to the client while parallel asynchronous data requests are resolved on the server.

## 2. Canonical Target Flow

The implemented, server-owned flow for a future enabled AI interaction is:

User
→ Next.js UI
→ server-side AI entry point
→ atomic shared admission (Upstash Redis Free; inactive while public generation is disabled)
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

**Current implementation:** the standalone MCP server, five TMDB tools, server-only client, deterministic Search Agent, Quality/Safety gate, Orchestrator, bounded same-origin NDJSON route, and `/discover` UI exist. The public route and Google provider activation remain disabled; enabled flows are tested with mocks. No user-facing result can bypass Quality. Implemented modules live in `src/server/agents/`; contracts are in [`docs/QUALITY_GATE.md`](../docs/QUALITY_GATE.md), [`docs/ORCHESTRATOR.md`](../docs/ORCHESTRATOR.md), and [`docs/STREAMING_UI.md`](../docs/STREAMING_UI.md).

## 3. Canonical Repository Boundaries

The current repository structure isolates the MCP server from the Next.js application:

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
    ├── agents/
    │   ├── orchestrator.ts
    │   ├── search-agent.ts
    │   └── quality-agent.ts
    ├── ai/
    │   └── search-handler.ts
    ├── mcp/
    │   └── client.ts
    └── telemetry/
        └── ai-metrics.ts

app/api/
├── ai/search/route.ts
└── telemetry/tokens/route.ts
```

## 4. MCP Server Boundary

* **Current State:** Next.js and the standalone MCP server both have server-side TMDB access; movie pages still use Next.js Server Actions. The server-only Orchestrator→Search→Quality pipeline exists. `/discover` and `/api/ai/search` provide the 6.7 UI/strict NDJSON boundary, but public availability and Google activation are disabled pending eligibility/privacy/abuse/security gates. Enabled AI data flows are mocked; existing movie pages are not migrated.
* **Target State:** The MCP server is a standalone Node.js process. It has an independent package, build, test, start, Docker, and deployment lifecycle. It is not embedded in the Next.js application.
* React components must never import MCP server modules. Next.js must communicate with MCP through a server-only network client. The browser must never call the MCP server directly.
* **Long-term data-access target:** migrate existing movie-page TMDB access to the MCP server only after the five approved tools cover every current page feature (including popular movies, trailers, and pagination). Until then, retain the existing server actions and document the duplication; `TMDB_API_KEY` currently exists on both server boundaries.

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
* **Standalone MCP server** → Render Free (separate Docker web service)

The MCP server must not be deployed inside the Next.js Vercel application.

**Decision Record:**
Comparing requirements (persistent Node.js HTTP process, Docker support, HTTPS, environment variables, health checks, predictable cold-start behavior, logs, Hobby/portfolio cost, deployment from GitHub), we recommend one deployment category: **Container-based managed service**.

**Deployment checkpoint (2026-10-29):** Next.js is deployed to `https://movie-explorer-luis.vercel.app` and MCP to Render Free. Commit `5419f86` is pushed and Vercel Ready is user-confirmed; the post-deploy AI smoke returns 503/disabled/no-store. The authenticated local Next.js adapter completed all five read-only Render tools. A handshake after a 16-minute no-agent-request window took 13.889s; external traffic was unobservable. Shared init is now 20s inside unchanged 30s pipeline/35s route/UI caps; longer Render wake-ups remain possible. Vercel runtime paths and Google inference remain unverified. Existing services Free/no-payment and Upstash eviction-disabled are operator-confirmed, not independently inspected. See [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md).

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
TMDB_API_KEY= # Existing movie pages; migrate only after MCP feature coverage is complete
GOOGLE_GENERATIVE_AI_API_KEY=
MCP_SERVER_URL=
MCP_INTERNAL_API_KEY=
AI_TELEMETRY_API_KEY= # Optional operator-only aggregate telemetry access
UPSTASH_REDIS_REST_URL= # User-configured Free database; local isolated REST check passed
UPSTASH_REDIS_REST_TOKEN=

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

Implemented provider contract: pinned `ai@6.0.314` / `@ai-sdk/google@3.0.137`, Google Generative AI API. Fixed model: `gemini-3.1-flash-lite`, no alternate-model fallback, retries, SDK continuations, or paid escalation. Phase 6.6 enforces exact-request token preflight (4,096 input / 512 output / 4,608 total), one planner invocation, 5 tool slots, 30s global / 10s per-tool deadlines, and controlled failures. Generation remains disabled without trusted server/operator Free Tier confirmation; confirm account/model access, billing eligibility, and privacy conditions before activation. The flag is not a billing check or guarantee. Search/Quality remain deterministic with no model calls. See [`docs/ORCHESTRATOR.md`](../docs/ORCHESTRATOR.md).

**Approval/configuration record (2026-10-22):** The user approved the current architecture/five MCP contracts, then the default model/no-alternate-fallback policy. Vercel Production configuration/redeployment is user-confirmed and local Google key presence was checked without exposing its value. All 6.0 entry approvals are complete; this is not provider-authentication/billing verification or authorization for paid usage/future MCP contract changes. The 6.6 Google runtime is implemented but disabled by default and tested only with synthetic HTTP responses; no Google request has been performed. Setup/status: [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md#approved-model-policy).

**Activation composition update (2026-10-29):** the operator in Brazil accepts Google's unpaid-service data use and asks to proceed. The production route now supplies the trusted Google assertion from server-owned availability (still false), after handler validation/admission. Expanded pt-BR disclosure links to official terms. Composition mocks, all 348 tests, lint/types/build pass; no live generation or deployment occurred. Visitor audience/access and runtime checks remain open; no provider migration is planned. Decision and next sequence: [`docs/AI_DEMO_DECISION.md`](../docs/AI_DEMO_DECISION.md).

**Temporary D4 diagnostic — completed runtime sample, local removal:** operator-supplied output reports Vercel→Upstash PING/isolated five-second EVAL passed in 83ms and fixed Vercel→Render/MCP Inception search passed in 928ms (1,015ms total). No production admission-key access, Google or public activation. The sample does not certify cold-start behavior. Temporary route/implementation/tests/caller/helper/command/example key are removed locally; 349 remaining tests/lint/types/build and compiled 404/disabled-AI smoke pass. Retirement commit/push/deploy, operator-only diagnostic-token removal and older-deployment handling remain pending. Existing MCP/Upstash/Google credentials stay intact. [`Runtime-check evidence`](../docs/AI_RUNTIME_CHECK.md).

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

**Implemented boundary policy:** existing MCP/Search source schemas strip unknown fields; Quality adds evidence size/status/provenance-consistency checks. Model proposals and final presentation DTOs reject unknown keys at every object level. Quality reconstructs only allowlisted evidence facts, never proposal prose, tool envelopes, or raw error details. Its plain-text values must be rendered as escaped text nodes, not HTML/Markdown. Evidence must be obtained through the server-side Search Agent, never accepted from a browser/model as purported TMDB truth.

**6.7 public boundary:** only public presentation/event schemas are shared under `src/lib/ai`; evidence, proposals, agents, provider/MCP code and configuration remain server-only. Ordered static progress and one Quality-approved terminal use NDJSON with request/response byte caps, deadlines/cancellation, and clean-EOF client validation. The public route is same-origin and currently returns controlled disabled status without invoking agents; it is not authenticated/rate-limited production generation. See [`docs/STREAMING_UI.md`](../docs/STREAMING_UI.md).

**6.8 operations boundary:** prompts/results/evidence are not cached. `src/server/telemetry/ai-metrics.ts` retains only fixed-cardinality process-local aggregates; `GET /api/telemetry/tokens` requires optional server-only `AI_TELEMETRY_API_KEY` and is uncached. This is not durable or cross-instance telemetry. Separately, explicitly approved Upstash Redis Free stores one atomic global admission history (at most ten timestamps): one admission every 60s and ten per rolling 24h across deployments. The enabled public route must pass admission before orchestration; configuration/store errors fail closed and no retries/refunds/local fallback are permitted. No IPs, cookies, visitor identifiers, prompts, or results go to the store. Hosted setup, local isolated Redis checks and local adapter→Render checks passed with operator-confirmed Free/no-payment/eviction-disabled settings. Vercel runtime paths and applicable Google privacy/audience conditions remain pending; AI stays disabled. See [`docs/AI_OPERATIONS.md`](../docs/AI_OPERATIONS.md).

## 12. Canonical MCP Tools

Exactly five Phase 6 tools: `search_movies`, `get_movie_details`, `get_recommendations`, `get_trending`, `get_credits`.

## 13. UI Governance (Immersive Minimalism) & Accessibility

* **Design System:** Follows "Immersive Minimalism", relying on design tokens (located in `shared/tokens/`), high-contrast dark surfaces, and "glassmorphic" depth (`.glass`).
* **WCAG 2.1 AA Compliance:** Strict accessibility adherence.
