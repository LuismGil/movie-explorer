# Model Context Protocol (MCP) Interface Specification

This document defines the interface, protocol structure, transport schemas, and tools exposed by the **Movie Explorer MCP Server**.

## 1. Server Configuration & Transport Protocols

The MCP Server is implemented as a standalone Node.js package under the `packages/mcp-server/` directory (Phase 6 target).

### Transport Mode
Use exactly one MCP transport: **Streamable HTTP**.
* MCP endpoint: `/mcp`
* Health endpoint: `/health`
* Readiness endpoint: `/ready`
No stdio transport, no legacy HTTP+SSE transport, no custom transport. Local development must also use Streamable HTTP. The server must bind to `127.0.0.1` by default locally. The MCP client must reject HTTP redirects. The server must validate allowed origins.

### Authentication
The MCP endpoint must require authentication.
Authorization: `Bearer <MCP_INTERNAL_API_KEY>`

### Environment Requirements
Standalone MCP server variables:
* `TMDB_API_KEY`
* `MCP_INTERNAL_API_KEY`
* `MCP_HOST=127.0.0.1`
* `MCP_PORT=3001`
* `MCP_ALLOWED_ORIGINS=`

## 2. Tool Definitions & Contracts

The server exposes exactly these five Phase 6 tools. For all tools:
* **Error Contract**: Wraps upstream TMDB errors or Zod validation errors into client-safe MCP-compliant JSON error envelopes.
* **Empty-Result Contract**: Returns an empty `results` array or structured empty payload instead of throwing an error when no matches exist.
* **Secret Constraint**: `TMDB_API_KEY` must never appear in tool parameters, outputs, or error logs.

### 2.1 `search_movies`
* **Purpose**: Search for movies by title or query string.
* **Input Schema**: `{ query: string, page?: number }`
* **Output Schema**: `{ results: MovieSummary[], total_pages: number }`
* **Required Fields**: `query`
* **Optional Fields**: `page`
* **Pagination Behavior**: Supports pagination parameter; returns total pages count.
* **Result Limit**: Capped at 20 results per page (TMDB default).
* **Timeout Behavior**: Fails safely after global timeout limit.
* **TMDB Attribution/Data Provenance**: Preserves exact TMDB IDs and original string formatting for titles/overviews.

### 2.2 `get_movie_details`
* **Purpose**: Retrieve comprehensive details of a movie by its TMDB ID.
* **Input Schema**: `{ movieId: string }`
* **Output Schema**: Full TMDB movie object mapping
* **Required Fields**: `movieId`
* **Optional Fields**: None
* **Pagination Behavior**: Not paginated.
* **Result Limit**: 1 movie detail object.
* **Timeout Behavior**: Fails safely after global timeout limit.
* **TMDB Attribution/Data Provenance**: Preserves exact TMDB IDs and structured metadata.

### 2.3 `get_recommendations`
* **Purpose**: Fetch recommended or similar movies for a given movie ID.
* **Input Schema**: `{ movieId: string }`
* **Output Schema**: `{ results: MovieSummary[] }`
* **Required Fields**: `movieId`
* **Optional Fields**: None
* **Pagination Behavior**: Not paginated in MVP (returns first page implicitly).
* **Result Limit**: Capped at top 20 recommendations.
* **Timeout Behavior**: Fails safely after global timeout limit.
* **TMDB Attribution/Data Provenance**: Preserves exact TMDB IDs.

### 2.4 `get_trending`
* **Purpose**: Get trending movies over a specified time window.
* **Input Schema**: `{ window?: "day" | "week" }`
* **Output Schema**: `{ results: MovieSummary[] }`
* **Required Fields**: None
* **Optional Fields**: `window`
* **Pagination Behavior**: Not paginated in MVP.
* **Result Limit**: Capped at top 20 trending items.
* **Timeout Behavior**: Fails safely after global timeout limit.
* **TMDB Attribution/Data Provenance**: Preserves exact TMDB IDs.

### 2.5 `get_credits`
* **Purpose**: Get members of the cast and key crew members (Director) for a movie.
* **Input Schema**: `{ movieId: string }`
* **Output Schema**: `{ id: number, cast: CastMember[], director: CrewMember }`
* **Required Fields**: `movieId`
* **Optional Fields**: None
* **Pagination Behavior**: Not paginated.
* **Result Limit**: Top 10 cast members and 1 director.
* **Timeout Behavior**: Fails safely after global timeout limit.
* **TMDB Attribution/Data Provenance**: Preserves exact TMDB IDs for persons and movie.
