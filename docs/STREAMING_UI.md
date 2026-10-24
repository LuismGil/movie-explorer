# Validated Streaming UI — Phase 6.7

`/discover` exposes a separate, localized discovery panel without changing the existing movie search/actions. Its Next.js server page passes a server-owned availability boolean to a leaf client component. **Generation remains disabled:** `src/server/ai/availability.ts` deliberately exports `false`, the form explains this, and the public route returns a controlled error without invoking Orchestrator or reading provider credentials. There is no demo response or simulated movie data in production.

## Browser/server contract

`POST /api/ai/search` accepts only the strict Orchestrator request `{ message, referenceMovieId? }`. It requires JSON and a matching Origin/Host (scheme included); cross-site Fetch Metadata is rejected and forwarded-host overrides are ignored. Host is checked because standalone Next.js can normalize `Request.url` to localhost. This is anti-cross-origin protection, **not authentication or a rate limit**.

The subsequent 6.8 admission gate is mandatory before Orchestrator whenever server availability is enabled: one request per 60 seconds and ten per rolling 24 hours globally, using one atomic Upstash Redis key with no visitor identifiers. The public gate remains false, so no storage/provider request is made by disabled traffic. Denials return `429`/`Retry-After` plus the strict `error/rate_limited` terminal; storage/config failures return `503`/`error/unavailable` without orchestration. The UI waits out a bounded cooldown without auto-retrying. Hosted Free configuration remains pending. See [`AI_OPERATIONS.md`](AI_OPERATIONS.md).

Actual incoming bytes are capped at **8 KiB**, regardless of Content-Length; invalid UTF-8, JSON, schemas, or extra options/evidence/approval fields fail closed. Request/body/pipeline waiting has a **35s outer deadline**, including stalled bodies; Orchestrator retains its 30s global limit. Stream cancellation/request disconnect aborts waiting/downstream continuation. Remote work already accepted may still finish or consume quota.

Responses use application-layer **NDJSON**, not raw AI SDK text streaming or the MCP transport. The MCP boundary remains unchanged: Streamable HTTP only. Response headers include `application/x-ndjson; charset=utf-8`, `no-store, no-transform`, `nosniff`, and disabled proxy buffering. Preflight rejections use non-2xx statuses with a single controlled error frame; streamed pipeline failures after headers use error events.

Every newline-terminated frame must match `src/lib/ai/stream-contract.ts`:

| Event | Allowed data |
|---|---|
| `progress` | One static stage: `planning`, `searching`, `validating`, in that order |
| `result` | `completed` or `needs_selection`, plus strict Quality-approved/partial/empty `presentation` |
| `unsupported` | No additional fields; UI provides localized guidance |
| `error` | Allowlisted application code; UI provides localized copy |

At most three progress events precede one terminal. Results require all three phases; errors/unsupported may terminate earlier. Progress means a stage was entered, not a guarantee it succeeded. No text tokens, claims, generated narrative, prompts/thoughts, raw Search/MCP data, model decisions, credentials, token usage, or exception messages are exposed. The public handler revalidates the entire Orchestrator result and serializes only the allowlisted public fields.

The client reader validates incremental UTF-8 across byte boundaries, caps the entire response at **2 MiB**, enforces event ordering and a single terminal, and rejects unknown/nested unsafe fields, missing newlines, truncation, trailing frames, and result frames on HTTP errors. It forwards only validated progress and **does not return presentation until clean EOF**. Invalid streams never render an initially valid-looking result. Reader cancellation/release, client timeout, stale-result suppression, explicit retry, and unmount cleanup are implemented; nothing retries automatically.

## Presentation and UI

Only public DTO definitions/text normalization moved into `src/lib/ai/presentation.ts`; existing server exports remain compatible. Search evidence/proposals, Quality execution, MCP, Google, environment access, and Orchestrator stay server-only. Sharing a DTO schema does not authenticate arbitrary browser/model evidence; the server still obtains all facts through Search→Quality.

`AIChatPanel` provides idle, honest disabled, connecting/stage progress, approved/partial/empty, unsupported, error, cancelled, retry, and title-selection states. Selection resubmits the **original** request with a verified result ID, not an edited draft or invented model ID. User-initiated retry preserves the request; there is no conversation history/localStorage or automatic fallback. The page renders canonical movie titles/overview/date/rating/director/runtime and fixed-origin poster paths, with links to existing movie pages. Null facts are not replaced with invented ratings/runtime. Text always uses escaped React nodes—never HTML/Markdown parsing.

Static copy is centralized in `src/i18n/messages.ts` (`pt-BR`). Styling is scoped to the new panel and imports the project's shared color/spacing/radius/typography tokens: charcoal surfaces, gold actions, purple stage indicators, and display/body/mono roles. Fonts use their token fallbacks without new external font requests; global premium polish remains Phase 7. The stage strip represents the actual three-stage sequence, stacks on narrow screens, and has no artificial timer/progress animation. New interactive controls have visible focus rings; the only transition is guarded by reduced-motion preference. Native form labels, disabled semantics, a polite live status, controlled selection actions, and keyboard cancellation/retry are included.

## Verification — 2026-10-22

- App lint/types/build and **281 tests** pass: the previous 213 plus **24 reader/contract**, **29 handler**, and **15 UI** cases. These cover malformed/trailing streams, split UTF-8, caps/deadlines/cancellation, cross-origin/extra-field rejection, disabled production route, real Orchestrator/Quality with mocked planning/Search, all UI outcomes, explicit selection/retry, stale responses, and cleanup. All **77 Quality** regressions still pass after DTO extraction.
- MCP lint/types/build and all **45 tests** pass; no MCP contracts/runtime were changed in 6.7.
- Chromium against a local **production standalone build**: `/discover` → HTTP 200, expected disabled controls, same-origin POST → HTTP 503 with only `{"type":"error","code":"disabled"}`, no-store headers, no page errors or external requests. Browser verification found/fixed a standalone Origin/URL mismatch and added a regression test.
- Desktop (1440 px) and mobile (320 px) axe WCAG A/AA checks returned **zero violations** on the disabled discovery page. No horizontal overflow at 320 px; keyboard focus outline verified. Screenshots stayed outside Git under `/tmp/opencode`; the temporary server was stopped.
- Targeted client-bundle scan found none of the Google endpoint/model or MCP-runtime error markers. This is a scoped boundary check, not a comprehensive secret/reachability/security audit.

Enabled streaming/results are tested with mocks, **not** browser/live Google/MCP. No production redeploy, Docker/Lighthouse rerun, full-site accessibility certification, billing verification, environment modification, new dependency, or paid usage occurred in 6.7. The later 6.8 dependency update cleared production-only audits; development-tool advisories remain documented in [`ORCHESTRATOR.md`](ORCHESTRATOR.md).

## Activation remains blocked

Do not make the public gate environment-controlled or enable it merely because a key is present. Before activation: confirm model/account access, quota, Free Tier billing eligibility and end-user privacy; obtain explicit live-test approval; implement/review abuse protection and rate limits; triage dependency security findings; and verify actual Next.js→MCP/Render cold starts. Only trusted server code may configure the separate 6.6 Google `freeTierConfirmed` assertion; it cannot guarantee free billing. Current public code has **neither gate enabled**.

Phase 6.8 keeps prompts/evidence/results out of cache and records only bounded process-local agent/tool aggregates. Upstash Redis Free was explicitly approved on 2026-10-23 and the distributed admission code/local tests are complete; operator setup and hosted verification remain an activation gate. No paid hosting/payment/model choice is authorized. See [`AI_OPERATIONS.md`](AI_OPERATIONS.md).
