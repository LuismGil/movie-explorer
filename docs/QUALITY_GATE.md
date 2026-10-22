# Quality/Safety Gate — Phase 6.5

`src/server/agents/quality-agent.ts` implements a deterministic, server-only gate. It makes **no Google, TMDB, or MCP calls** and reads no credentials. The [6.6 Orchestrator](ORCHESTRATOR.md) sequences Search→Quality; the [6.7 entry/UI](STREAMING_UI.md) shares only public presentation schemas under `src/lib/ai/presentation.ts` and remains disabled for live generation. Evidence/proposals/execution stay server-only, with existing server exports preserved.

## API and Trust Boundary

```ts
import { runQualityAgent } from '@/server/agents/quality-agent';

// searchResult must come from runSearchAgent on the server, not a client/model.
const presentation = runQualityAgent(searchResult, {
  movies: [{
    movieId: 27205,
    claims: [{ field: 'title', value: 'A Origem' }],
  }],
});
```

`qualityAgentProposalSchema` and `qualityAgentResultSchema` are exported with inferred TypeScript types. Search contracts are shared in `search-agent.schemas.ts`; existing Search Agent exports remain compatible. Quality imports only data schemas, not the MCP client/executor.

The evidence argument is **trusted server provenance**, though its structure/content is revalidated. This function cannot authenticate an arbitrary object or prove that a browser/model-supplied evidence object came from TMDB. A future public entry point must construct evidence through the Search Agent and never accept it from the request body.

## Proposal Contract

- At most **20** selections, each with a positive integer `movieId` and optional `claims` (default empty).
- At most **20 claims per selection**. Repeated movie IDs are grouped in first-selection order; every supplied claim is checked, so a later duplicate cannot hide a contradiction.
- Claims are discriminated by `field`:

| Field | Value | Required evidence |
|---|---|---|
| `title`, `overview` | Nonempty plain string | Exact canonical text after source sanitization |
| `release_date` | ISO `YYYY-MM-DD` | Known matching date |
| `vote_average` | Number from 0 to 10 | Known matching rating |
| `runtime` | Nonnegative integer | Matching detail runtime |
| `genre` | `{ id, name }` | Matching movie genre ID/name |
| `director` | `{ id, name }` | Matching movie-scoped director; source job must be `Director` |
| `cast_member` | `{ id, name, character }` | Matching movie-scoped cast ID/name/role |

No arbitrary explanations, raw Markdown/HTML responses, awards, invented scores, caller URLs, or unknown keys are accepted. Malformed proposals fail closed as a whole. Structurally valid but unsupported/contradictory selections are rejected individually, preserving other valid movies.

## Evidence Validation

- Reuses Search Agent schemas; unknown source properties are stripped as in the existing Search contract. Proposal and presentation objects **reject unknown keys**, including nested keys. This is the boundary policy; unknown provider/source fields never flow into the DTO.
- Caps evidence at **100 movies, 5 detail records, 5 credits records, and 1–5 outcomes**. Strings and nested metadata are bounded before text normalization: titles/names/roles 500 characters, overviews 10,000, image paths 1,000, genres 30 per film, cast 10 per film. Oversized evidence fails closed rather than being silently truncated.
- Requires unique IDs within each evidence collection, unique contiguous call indexes, status consistent with successful/failed outcomes, and data counts supported by successful tool outcomes. Details must reference an available movie; orphan credits cannot establish a movie or attach facts to another ID.
- Compares available summary/detail title, overview, poster, date, and rating; conflicting known facts reject that movie. Missing fields may be filled only from matching details.
- Missing metadata is unknown (`null` or an empty collection), never invented. Zero ratings/runtime remain known zero values. Absence from the top-ten cast does not prove an actor is absent from the film; an unlisted actor claim is unsupported, not approved.
- Valid results survive partial Search Agent failures; a partial source cannot become an authoritative successful empty result.

## Presentation DTO and Sanitization

The output has exactly `status`, `source: 'tmdb'`, `movies`, and `issues`. Movie objects contain only validated ID, canonical title/overview, relative poster path, date/rating, genres/runtime, cast, and director. Data is rebuilt from evidence, not copied from model claims. No raw tool outcomes, provider text, private prompts, configuration, or proposed explanations are included.

Source text has markup/active element blocks, controls, and bidi overrides removed; whitespace is normalized. Empty titles, malformed dates, invalid numeric ranges, and recognized credential-like text reject the movie. Only simple relative TMDB image paths with supported image extensions survive; other paths become `null`. Issue objects contain only fixed codes and, where applicable, numeric movie IDs/known field names. They never echo rejected values or validation diagnostics.

**Render these values as ordinary escaped text nodes, never HTML or Markdown.** This normalization is not a general HTML sanitizer, and pattern checks cannot recognize every possible secret. Secrets/private prompts must never be supplied as movie evidence in the first place.

| Status | Meaning |
|---|---|
| `approved` | All selected movies/claims are grounded and Search completed |
| `partial` | Some selections were rejected or Search had partial failures; valid movies are retained |
| `empty` | Valid selection is empty and Search completed successfully |
| `rejected` | Invalid evidence/proposal or no requested movie could be approved |
| `unavailable` | A valid Search result reports all calls failed; no movie data is shown |

Final output is checked again with a strict Zod DTO schema. Public issues are bounded to one per selected movie plus one partial-search notice (maximum 21).

## Deliberate Limits

- This is an exact structured-fact gate, **not** an LLM judge, natural-language entailment checker, toxicity classifier, or proof that source text is true. Unsupported free-form narrative is rejected instead of being guessed at.
- It detects conflicts retained in the aggregated evidence. Conflicts already discarded by Search Agent deduplication cannot be reconstructed here; per-call provenance/history would require a separate contract change.
- Orchestrator 6.6 compiles selection/tool intent and enforces provider timeout/retry/token budgets; the gate does not independently judge semantic relevance, recommendation provenance, or user preferences. Controlled UI messaging remains integration work.
- The approved `gemini-3.1-flash-lite`/no-alternate-fallback policy is recorded in [deployment policy](DEPLOYMENT.md#approved-model-policy), but no model is invoked by this gate. Google access/Free Tier billing status and end-user privacy conditions must be checked before live generation.

## Verification

Local verification on 2026-10-22: lint, typecheck, build, and all **99 app tests** pass, including **77 Quality/Safety tests**; MCP lint/typecheck/build and **45 tests** pass. No fresh browser/axe/Lighthouse, Docker, live MCP, or Google generation checks were run for this server-only feature.

The focused suite covers every claim kind, contradictory/missing/cross-movie facts, duplicates, partial/unavailable/empty results, source/proposal limits, text/path safety, credential-like content, strict DTOs, immutability, no-network execution, and mocked Search→Quality integration.

```bash
npm run test -- --run src/server/agents/__tests__/quality-agent.test.ts
```

Tests use synthetic public-shaped fixtures and mocked MCP data; they do not require or transmit live credentials.
