# Orchestrator — Phase 6.6

`src/server/agents/orchestrator.ts` coordinates the server-only **Planner → Search → Quality/Safety** pipeline. Existing movie pages still use their TMDB actions. The subsequent [6.7 route/UI](STREAMING_UI.md) adds a disabled-by-default public entry and only static stage notifications/Quality presentation, never model text. No live Google call was made to implement or verify these phases.

## Request and trust boundaries

```ts
await runOrchestrator({ message: 'Find Example' });
// Controlled provider_disabled until server/operator Free Tier approval.
```

The strict request contains only `message` (1–1,000 trimmed characters before normalization) and optional positive integer `referenceMovieId`. HTML/control/directional characters are normalized; empty values, known credential references, and unknown keys are rejected. This is not a general secret detector: never submit secrets or private data.

The second `options` argument is **trusted server configuration**, never a deserialized browser object. It supports cancellation, lower runtime ceilings, an explicitly approved Google adapter, and injected planner/Search/Quality implementations for tests. Browser/model input cannot supply evidence, dependencies, credentials, an approval flag, model names, or runtime settings.

The model returns only `{ intent, queries, movieId, window }`, validated strictly with Zod. A deterministic compiler—not arbitrary model-authored tool code—builds the MCP plan:

| Intent | Compiled tools |
|---|---|
| `search` | `search_movies` for 1–3 unique title queries; first page only |
| `trending` | `get_trending`, explicit `day` or `week` |
| `details`, `credits` | `get_movie_details` + `get_credits` for the supplied reference ID |
| `recommendations` | `get_recommendations` for the supplied reference ID |
| `clarify_movie` | One `search_movies` query, then require user selection if matches exist |
| `unsupported` | No tools or presentation; controlled status |

ID-based plans must match the request's `referenceMovieId`; invented/changed IDs are rejected. A named title requiring an ID should produce `clarify_movie` rather than silently choosing a search result. There is no second model round, automatic follow-up search, arbitrary filtering, genre search, or conversational memory in 6.6. Classification accuracy and real semantic behavior remain unverified until approved live tests.

Search obtains all evidence through the server-only MCP adapter. Orchestrator selects at most the first 20 Search movie IDs and passes them, without model prose/claims, through `runQualityAgent`. Only the gate's reconstructed DTO can become `presentation`. The model's decision, raw Search context/outcomes, raw provider/MCP envelopes, prompts, and errors are never returned. See [`QUALITY_GATE.md`](QUALITY_GATE.md) for evidence/schema limitations. Render presentation strings as escaped text, never HTML/Markdown.

## Runtime ceilings

| Limit | Default and hard maximum |
|---|---|
| Global pipeline deadline | 30,000 ms, including planning and MCP initialization |
| Shared MCP initialization | 10,000 ms, separately bounded |
| Individual MCP tool request | 10,000 ms; progress cannot extend it |
| MCP calls reserved | 5; complete compiled plan checked before Search |
| Planning invocations | 1 |
| Google HTTP attempts | At most one `countTokens`, then one `generateContent` |
| Model input | 4,096 tokens |
| Model output | 512 tokens, including reported reasoning usage |
| Total model usage | 4,608 tokens |
| Retry / alternate-model fallback | 0 / none |

Server options may lower—but not raise—the schema-controlled ceilings. Both successful and failed MCP attempts consume their reserved slot; plans are never silently truncated or retried. Tool calls inside Search remain parallel. No application retry occurs after an authentication, quota, model, network, initialization, or tool failure. A later independent user request may reconnect MCP.

The Google adapter uses exact `ai@6.0.314` and `@ai-sdk/google@3.0.137`, pinned to the approved SDK 6 line. The model is fixed to `gemini-3.1-flash-lite`; no AI Gateway, external search/URL tools, automatic continuation, paid escalation, or model override is enabled. `maxRetries: 0`, structured output, minimal thinking, hidden thought output, disabled SDK telemetry, abort propagation, and redirect rejection are explicit.

Its fetch wrapper counts the **actual SDK wire request**, including system/schema steering fields, with `countTokens.generateContentRequest`. Generation is blocked unless the count is valid, fits the input ceiling, and leaves room for the configured maximum output within the total budget. The generation request sets `maxOutputTokens`; reported usage is checked again before tools run. Missing/invalid usage fails closed. Preflight is provider-reported, not a local estimate or a billing guarantee; an upstream budget violation detected afterward cannot undo consumed tokens. No repair generation, SDK continuation, or retry is permitted.

The global deadline aborts pending work and stops waiting even if an injected dependency ignores cancellation. Late results cannot continue into Search/Quality. Synchronous validation cannot be preempted; bounded schemas and post-stage clock checks reject results completed after the deadline. Abort is cooperative: remote work already accepted by Google/MCP/TMDB might still finish or consume quota. Shared MCP initialization has an independent deadline, so one cancelled waiter does not break other callers. Connection failure/disconnection clears the singleton; initialization is shared to prevent half-connected clients. HTTP redirects are rejected to protect Bearer headers; this is not a full SDK security remediation.

## Outcomes

- `completed`: approved/partial/empty Quality `presentation`, intent, and usage.
- `needs_selection`: `clarify_movie` with one or more Quality-approved choices. A subsequent request supplies the chosen `referenceMovieId`.
- `unsupported`: controlled `unsupported_request` code and usage; no generated explanation.
- `failed`: allowlisted code and usage; **no presentation or raw error**. Codes cover request/configuration/plan/usage errors, budgets, provider disabled/auth/quota/unavailability, cancellation/deadline, Search unavailability, gate rejection, and unexpected internal failure.

`usage.plannerCalls` counts planner invocations (including disabled/failed planning), not billed requests. `toolCallsReserved` counts planned slots, not confirmed remote executions. Token fields are `null` when reliable usage was not available; they must not be interpreted as zero cost. These fields support later observability, not billing reconciliation. Valid partial searches survive Quality; total Search failure is distinct from a successful empty search. Static localized UI copy/progress belongs to 6.7.

## Activation gate and remaining verification

Production generation stays disabled by default even with a configured `GOOGLE_GENERATIVE_AI_API_KEY`. Only after confirming account/model access, quotas, **Free Tier billing eligibility**, privacy conditions, and explicit live-test approval may trusted server code supply `google: { freeTierConfirmed: true }`. Do not expose this flag in a request, add a public diagnostic endpoint, enable billing, or switch to another model to work around errors. The flag records an operator assertion; it does not query Google billing or force free pricing on a paid project.

Local verification (2026-10-22): app lint/types/build and **213 tests** pass: 67 Orchestrator, 32 Google-adapter tests using the real AI SDK with synthetic HTTP responses, 17 Search, 7 MCP-client, 77 Quality, and 13 existing app/env/UI tests. MCP lint/types/build and all **45 tests** also pass. No live Google/MCP, browser/axe/Lighthouse, or Docker checks were run for this phase.

**Dependency security update (2026-10-23):** targeted same-major updates moved Next.js to 16.4.3, Axios to 1.20.0, MCP SDK to 1.32.2, and Zod to 4.6.7. Root and MCP `npm audit --omit=dev` both report zero vulnerabilities. The full root development audit still reports 19 findings in Lighthouse CI/Puppeteer and Tailwind 3 toolchains; available automated fixes require a Lighthouse CI downgrade or Tailwind 4 migration, neither applied. The MCP development audit retains one low `esbuild` advisory. Production audit cleanliness is not a reachability assessment or a complete security certification.

Subsequent checkpoint: 6.7 validated UI/stream contracts remain implemented with production generation disabled; see [`STREAMING_UI.md`](STREAMING_UI.md). 6.8 records process-local agent/tool latency and reported token aggregates without caching user data; the authenticated endpoint and limits are described in [`AI_OPERATIONS.md`](AI_OPERATIONS.md). A distributed rate limiter, actual Next.js→MCP/Render execution, confirmed cold-start timing, and provider/billing/privacy approval remain open. A Render wake-up can exceed the deliberately bounded deadlines; no paid hosting change or unbounded retry is authorized. Remaining TMDB-action migration is still later work.

References: [AI SDK structured output](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data), [Google token counting](https://ai.google.dev/gemini-api/docs/tokens), [approved deployment/model policy](DEPLOYMENT.md#approved-model-policy).
