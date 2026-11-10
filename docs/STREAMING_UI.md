# Validated Streaming UI — Phase 6.7

`/discover` exposes a separate, localized discovery panel without changing the existing movie search/actions. Its Next.js server page passes server-owned availability and region status to a leaf client component. **Activation authorized 2026-11-02:** `src/server/ai/availability.ts` now exports `true` in source; this change has not been deployed. The API enforces the existing region restriction, adult self-declaration and shared admission. No canned/simulated movie data is used. [Current authorization, limits and rollback](AI_RELEASE.md).

## Browser/server contract

`POST /api/ai/search` accepts only the strict Orchestrator request `{ message, referenceMovieId? }`. It requires JSON and a matching Origin/Host (scheme included); cross-site Fetch Metadata is rejected and forwarded-host overrides are ignored. Host is checked because standalone Next.js can normalize `Request.url` to localhost. This is anti-cross-origin protection, **not authentication or a rate limit**.

Before body reading or admission, an enabled request must also include `x-ai-adult-declaration: 18-or-older-v1`; otherwise it returns HTTP 403/`adult_confirmation_required`. This header records a user-controlled self-declaration, **not verified age or Google approval**. The checkbox is unchecked by default, stored only in component memory, and gates initial/selection/retry submissions. No DOB, documents or declaration cookie; decline routes to the public catalog. The header is not passed into the model request. Actual under-18 audience eligibility is not certified by this control.

The subsequent 6.8 admission gate is mandatory before Orchestrator whenever server availability is enabled: one request per 60 seconds and ten per rolling 24 hours globally, using one atomic Upstash Redis key with no visitor identifiers. Disabled, invalid, region-denied or undeclared-adult traffic makes no storage/provider request. Denials return `429`/`Retry-After` plus the strict `error/rate_limited` terminal; storage/config failures return `503`/`error/unavailable` without orchestration. The UI waits out a bounded cooldown without auto-retrying. The user reports hosted Free configuration; isolated REST checks passed, but dashboard entitlements remain unverified. See [`AI_OPERATIONS.md`](AI_OPERATIONS.md).

Actual incoming bytes are capped at **8 KiB**, regardless of Content-Length; invalid UTF-8, JSON, schemas, or extra options/evidence/approval fields fail closed. Request/body/pipeline waiting has a **35s outer deadline**, including stalled bodies; Orchestrator retains its 30s global limit. Stream cancellation/request disconnect aborts waiting/downstream continuation. Remote work already accepted may still finish or consume quota.

Responses use application-layer **NDJSON**, not raw AI SDK text streaming or the MCP transport. The MCP boundary remains unchanged: Streamable HTTP only. Response headers include `application/x-ndjson; charset=utf-8`, `no-store, no-transform`, `nosniff`, and disabled proxy buffering. Preflight rejections use non-2xx statuses with a single controlled error frame; streamed pipeline failures after headers use error events.

Every newline-terminated frame must match `src/lib/ai/stream-contract.ts`:

| Event | Allowed data |
|---|---|
| `progress` | One static stage: `preparing`, `planning`, `searching`, `validating`, in that order |
| `result` | `completed` or `needs_selection`, plus strict Quality-approved/partial/empty `presentation` |
| `unsupported` | No additional fields; UI provides localized guidance |
| `error` | Allowlisted application code; UI provides localized copy |

At most four progress events precede one terminal. Results require all four stages; errors/unsupported may terminate earlier. Preparation initializes/reuses the existing MCP connection before Google token preflight/generation; failure stops without sending the prompt to Google. After 8s in preparation, a local UI notice explains the wait and offers the catalog. No network warm-up, polling or retry is introduced. Progress means a stage was entered, not a guarantee it succeeded. No text tokens, claims, generated narrative, prompts/thoughts, raw Search/MCP data, model decisions, credentials, token usage, or exception messages are exposed. The public handler revalidates the entire Orchestrator result and serializes only the allowlisted public fields.

The client reader validates incremental UTF-8 across byte boundaries, caps the entire response at **2 MiB**, enforces event ordering and a single terminal, and rejects unknown/nested unsafe fields, missing newlines, truncation, trailing frames, and result frames on HTTP errors. It forwards only validated progress and **does not return presentation until clean EOF**. Invalid streams never render an initially valid-looking result. Reader cancellation/release, client timeout, stale-result suppression, explicit retry, and unmount cleanup are implemented; nothing retries automatically.

## Presentation and UI

Only public DTO definitions/text normalization moved into `src/lib/ai/presentation.ts`; existing server exports remain compatible. Search evidence/proposals, Quality execution, MCP, Google, environment access, and Orchestrator stay server-only. Sharing a DTO schema does not authenticate arbitrary browser/model evidence; the server still obtains all facts through Search→Quality.

`AIChatPanel` provides idle, honest disabled, connecting/stage progress, approved/partial/empty, unsupported, error, cancelled, retry, and title-selection states. When enabled, a quiet pt-BR note explains that the first search after inactivity may take longer while the free service starts; it is hidden while the AI gate is disabled. Selection resubmits the **original** request with a verified result ID, not an edited draft or invented model ID. User-initiated retry preserves the request; there is no conversation history/localStorage or automatic fallback. The page renders canonical movie titles/overview/date/rating/director/runtime and fixed-origin poster paths, with links to existing movie pages. Null facts are not replaced with invented ratings/runtime. Text always uses escaped React nodes—never HTML/Markdown parsing.

Static pt-BR copy lives in `src/i18n/catalog.ts` and `src/i18n/ai.ts`; `messages.ts` retains the complete dictionary API. Catalog clients do not import Discover-only copy. Styling imports the project's shared tokens: charcoal surfaces, gold actions, purple stage indicators, and display/body/mono roles. Fonts use token fallbacks without external requests; global premium polish remains Phase 7. The strip represents the four real stages, stacks on narrow screens, and has no artificial progress animation. New controls have visible focus rings; transitions respect reduced motion. Native form labels/fieldset/checkbox, disabled semantics, a polite live status, and keyboard cancellation/retry are included.

## Verification — 2026-10-22

### Subsequent quota UX verification — 2026-10-29

The operator in Brazil accepts Google unpaid-service data use and chooses direct public demo access without invitations/accounts. The pt-BR privacy notice now explains improvement use/possible human review and links to Google's terms. Production composition is prepared using server-owned availability, still false.

On 429, the panel converts bounded `Retry-After` to an absolute expiry and displays a real hours/minutes/seconds countdown outside the live status region (`role="timer"`, `aria-live="off"`). It catches up on tab visibility changes, provides a catalog link, and announces manual retry availability at expiry. Shared rolling-window limits remain unchanged; no midnight reset, automatic requests, polling or reserved slot is implied. The server rechecks admission on every submission, including after page reload. An approved AI-only EEA/CH/UK/unknown-country gate runs before admission; the catalog stays public worldwide. Public AI remains disabled, and adult-audience/runtime checks remain pending.

Lint/typecheck/build and 349 tests pass, with five opt-in Redis cases skipped. UI tests cover minute countdown updates, disabled controls, expiry, timer cleanup, long waits and tab-resume synchronization; production composition tests cover trusted approval only after admission. Earlier verification below is historical.

- App lint/types/build and **281 tests** pass: the previous 213 plus **24 reader/contract**, **29 handler**, and **15 UI** cases. These cover malformed/trailing streams, split UTF-8, caps/deadlines/cancellation, cross-origin/extra-field rejection, disabled production route, real Orchestrator/Quality with mocked planning/Search, all UI outcomes, explicit selection/retry, stale responses, and cleanup. All **77 Quality** regressions still pass after DTO extraction.
- MCP lint/types/build and all **45 tests** pass; no MCP contracts/runtime were changed in 6.7.
- Chromium against a local **production standalone build**: `/discover` → HTTP 200, expected disabled controls, same-origin POST → HTTP 503 with only `{"type":"error","code":"disabled"}`, no-store headers, no page errors or external requests. Browser verification found/fixed a standalone Origin/URL mismatch and added a regression test.
- Desktop (1440 px) and mobile (320 px) axe WCAG A/AA checks returned **zero violations** on the disabled discovery page. No horizontal overflow at 320 px; keyboard focus outline verified. Screenshots stayed outside Git under `/tmp/opencode`; the temporary server was stopped.
- Targeted client-bundle scan found none of the Google endpoint/model or MCP-runtime error markers. This is a scoped boundary check, not a comprehensive secret/reachability/security audit.

Enabled streaming/results are tested with mocks, **not** browser/live Google/MCP. No production redeploy, Docker/Lighthouse rerun, full-site accessibility certification, billing verification, environment modification, new dependency, or paid usage occurred in 6.7. The later 6.8 dependency update cleared production-only audits; development-tool advisories remain documented in [`ORCHESTRATOR.md`](ORCHESTRATOR.md).

## Current activation and historical verification

Do not make the public gate environment-controlled or enable it merely because a key is present. Both source interlocks are enabled following explicit 2026-11-02 operator authorization, not as a consequence of configured credentials. R4 is resolved from the operator's stated adult audience and portfolio-demo purpose, with residual public-access uncertainty; the declaration is not age verification. R5's no-body production spoof check passed within one network vantage; R6 diagnostic cleanup remains open. Two separately authorized R7 browser attempts were inconclusive, with no verified terminal result/EOF; both authorizations are consumed, so no retry is authorized. Only trusted server code may configure Google `freeTierConfirmed`; it cannot guarantee free billing. Earlier verification counts/disabled behavior above are historical. See [`AI_RELEASE.md`](AI_RELEASE.md), [`AI_GEO_CHECK.md`](AI_GEO_CHECK.md), and [`AI_VERCEL_CHECK.md`](AI_VERCEL_CHECK.md).

Phase 6.8 keeps prompts/evidence/results out of cache and records only bounded process-local agent/tool aggregates. Upstash Redis Free was explicitly approved on 2026-10-23 and the distributed admission code/local tests are complete; operator setup and hosted verification remain an activation gate. No paid hosting/payment/model choice is authorized. See [`AI_OPERATIONS.md`](AI_OPERATIONS.md).
