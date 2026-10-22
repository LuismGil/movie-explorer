# Movie Explorer: Technical Specification

## 1. Agent Responsibilities

The system freezes exactly three agents with strictly isolated responsibilities:

### Orchestrator Agent
* **Owns**: intent classification, execution planning, tool selection, agent sequencing, global timeout, tool-call budget, token budget, and final pipeline coordination.
* **Constraints**: It must not call TMDB directly.

### Search Agent
* **Owns**: MCP tool execution, result aggregation, normalization, deduplication, preservation of TMDB IDs, partial failure handling, and structured search context.
* **Constraints**: It must not render user-facing content. It must not call TMDB directly.

### Quality/Safety Agent
* **Owns**: factual validation against MCP-derived data, unsupported-claim rejection, contradiction detection, schema validation, sanitization, and final structured UI DTO approval.
* **Constraints**: It is the only agent allowed to approve final user-visible AI data. It must not bypass schemas.

## 2. Dynamic Pipeline & Data Validation Flow
1. **User input** → validated request schema.
2. **Next.js UI** → server-side AI entry point → **Orchestrator Agent**.
3. **Orchestrator Agent** builds an execution plan and calls the **Search Agent**.
4. **Search Agent** executes MCP tools through a server-only MCP Client Adapter via Streamable HTTP (with Bearer auth).
5. **Standalone MCP Server** calls TMDB API and returns validated tool output schemas to the Search Agent.
6. Search Agent returns an aggregated, validated agent schema to the **Quality/Safety Agent**.
7. Quality/Safety Agent verifies data, sanitizes it, and outputs a validated presentation DTO schema.
8. The result is safely sent to the accessible Streaming UI.

### 6.5 Deterministic Quality Contract

`runQualityAgent(evidence, proposal)` accepts trusted, server-produced Search Agent results and an untrusted structured movie selection. The proposal may contain at most 20 selections, each with a numeric TMDB movie ID and at most 20 typed claims. Allowed claim fields: title, overview, release date, rating, runtime, genre, director, and cast member/role. Arbitrary narrative, Markdown/HTML responses, and unknown proposal keys are rejected.

The gate checks exact canonical facts, movie-scoped metadata, available summary/detail contradictions, and source status/outcome consistency. It reconstructs a strict, sanitized DTO from evidence rather than forwarding proposal values, raw MCP envelopes, provider messages, or tool outcomes. Valid movies survive rejected selections/partial source failures. Unavailable searches are distinct from successful empty searches. Data remains text-only: it must never be rendered as HTML or Markdown.

See [`docs/QUALITY_GATE.md`](../docs/QUALITY_GATE.md) for schemas, limits, statuses, evidence-trust assumptions, and known limitations. The gate makes no network/provider calls; Orchestrator and UI integration remain later tasks.

## 3. Streaming Response Contracts
* **Allowed**: Progress events may be streamed only when they contain controlled application-defined status data.
* **Forbidden**: Never stream raw model output, raw MCP responses, private prompts, chain-of-thought, tool arguments containing secrets, or unvalidated Markdown or HTML.
