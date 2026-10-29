# AI Portfolio Demo — Privacy and Activation Decision

Reviewed: **2026-10-29**. **Latest decision: operator in Brazil accepts Google's unpaid-service data use and asks to proceed with the demo.** Google/model approval remains valid. Local activation wiring/disclosure are prepared with public availability off; visitor audience/access and runtime release checks remain pending. No inference has been performed.

This decision supersedes the earlier clarification-stage narrative below. Do not repeatedly ask for privacy acceptance or infer a demo exemption. The operator's location does not establish visitor location or age.

**Subsequent UX decision:** the user chooses direct public demo access, rejecting invitations, account creation and contacting the owner for a link. Keep that requirement. A Brazil-only restriction was suggested but not approved or implemented. This settles the intended UX, not worldwide provider eligibility; do not silently introduce access friction or claim the quota solves distribution conditions.

**Implemented quota experience:** shared admission remains one/60s and ten/rolling 24h. A denied request shows a real hours/minutes/seconds countdown using server `Retry-After`, explains the shared limit, and offers the normal catalog. It updates after tab suspension and enables manual retry when the wait ends. No polling, automatic inference, midnight reset or guaranteed available slot. The countdown is outside the live status region to avoid announcing every second. Lint/types/build and 349 tests pass (five opt-in Redis cases skipped); generation is still disabled and no provider call was made.

## Plan review: what is actually incomplete?

The architecture and fixed `gemini-3.1-flash-lite`/no-fallback model policy were explicitly approved on 2026-10-22. Those approvals remain valid. The same plan separately left provider access, Free eligibility, privacy and live integration pending. **Unresolved is not rejected:** the user's questions about privacy do not withdraw Google approval or select a replacement.

The earlier strategic blueprint (`movieexplorer-implementation_plan-v2.md`) assumed Gemini Pro/Flash and estimated token costs; it did not establish a universally Free, private, globally eligible deployment. The authoritative execution plan later approved the single-model design and deterministic Search/Quality. There is no need to restart those completed implementation units.

The planning/communication gap was reporting “entry approvals complete” without making the remaining release conditions equally clear. The age/region implications were explained too late, and recommending migration before clarifying the user's privacy boundary was premature. They are existing published conditions now identified, **not evidence of a newly changed Google policy or a broken deployment**.

| Area | Current evidence | Actual remaining work |
|---|---|---|
| Architecture/model | Approved; implemented with mocked provider tests | Retain Google; do not reopen or migrate by default. |
| Existing Free/no-payment plans and eviction | Operator confirmed | Record that confirmation; do not repeatedly request the same confirmation. |
| Google privacy/distribution | Operator in Brazil accepts unpaid-service data use; visitor audience/access unresolved | Establish eligible visitor audience/access; do not repeat the operator's privacy decision. |
| Public activation wiring | Route now supplies the Google assertion from server-owned availability, still false | Verify production-composition mocks and close release gates before enabling. |
| Live provider/runtime behavior | Google never called; local adapter→Render passed, Vercel→Render unverified | Protected runtime checks and one separately authorized inference; do not label untested behavior a provider failure. |
| Render startup | Observed 13.889s; init cap now 20s | Agree on bounded demo startup behavior; no need to promise a production SLA or replace hosting automatically. |

**Direct answer:** Gemini must receive the submitted prompt to perform hosted inference. In the general Unpaid Services arrangement Google also uses content for improvement and may have humans review it; the regional exception below matters. There is no application-code switch that overrides those terms. If the user declines the applicable content-use terms, that **Google Free arrangement** cannot be activated under the current constraints. It does not disable the movie application or rule out all AI. Clarify the applicable terms first; only then consider a different route if necessary.

## Goal and non-negotiables

Deliver a usable portfolio demonstration of **real inference**, not permanently disabled AI or canned results presented as live generation. Preserve the current supported movie intents; do not promise a general-purpose assistant or unsupported genre/mood filtering.

- Free Tier only: no card, bank/debit payment method, paid upgrade, or expiring-credit dependency.
- The user in Brazil has accepted Google's unpaid-service data use and asked to proceed. Record that decision without assuming every future visitor is eligible or treating demo status as an exemption.
- No provider switch, model download, new account, dependency or production diagnostic is authorized. The earlier plan calls for separately scoped permission for the first real inference; no inference is performed during this preparation.
- Keep both public AI availability and Google activation disabled until the selected route's gates pass. No automatic provider/model fallback.
- Phase 6 stays open; Phase 7 does not start. Any different phase order requires explicit approval.

## Evidence already available

- Commit `5419f86` is pushed; the user confirmed Vercel Ready. The subsequent production smoke returned `/discover` HTTP 200 and `POST /api/ai/search` HTTP 503 `disabled`, with `no-store, no-transform`. The startup hint was hidden. This did **not** exercise Upstash, MCP, or Google from Vercel.
- The user confirms all currently configured services are Free with no cards/payment methods, and Upstash eviction is disabled. Dashboards were not independently inspected; do not repeatedly treat the operator's confirmation as missing.
- Hosted Upstash PING and isolated temporary-key EVAL passed locally, without touching the production admission key. All five authenticated read-only Render tools passed through the local app adapter.
- The observed initialize-only Render handshake took 13.889s after a 16-minute no-agent-request window; outside traffic was unobservable. Initialization is now capped at 20s, inside the unchanged 30s pipeline and 35s route/UI bounds. Longer wake-ups remain possible.
- AI Studio values reported by the user: `0 / 60`, `0 / 100K`, `0 / 100`, apparently usage/limits for RPM, input TPM, and RPD respectively. This is not an independent check of the selected model/project or provider access.
- No live Google token-counting or generation request has been performed. The last runtime verification passed lint, typecheck, build, and 344 tests; this document does not claim a fresh test run.

## What the current Google adapter would transmit

If explicitly enabled, `src/server/agents/google-planner.ts` sends static system instructions, the validated `{ message, referenceMovieId? }` request, and structured-output configuration/schema to Google. `google-planner.fetch.ts` first sends the actual generation request to Google's `countTokens` endpoint, then permits one generation request within budget. **Token counting also transmits the input; it is not a privacy-free diagnostic.**

The output is a structured intent decision. Search then calls Render/MCP, and Quality validates the resulting movie evidence locally; there is no second model round with the TMDB results. The implemented flow does not attach watchlist storage, browsing history, a conversation transcript, or unrelated files to the model request. The API credential is supplied for authentication, not as prompt text.

This does not grant the provider general access to a visitor's Gmail, files, passwords, or browser. However, any personal data typed into `message` would be part of the submitted input. Local `no-store`, sanitized telemetry, and removing account linkage do not make that text anonymous or override provider policy. Movie search arguments also travel through Render to TMDB; local inference alone would not make the **whole application** offline.

## Google findings that change the release gate

The official Gemini terms, effective March 23, 2026, distinguish separate issues:

1. **Unpaid-service content use:** Google uses submitted content and generated responses to improve/develop products and machine-learning technologies. Human reviewers may read, annotate, and process inputs/outputs. Google disconnects account/API-key/project linkage before that review; this does not remove identifying text inside a prompt. Do not submit personal, sensitive, or confidential information. This is not automatic public publication of queries.
2. **Regional data-use exception:** the paid-service data-use provisions apply to developers in the EEA, Switzerland, or UK even for unpaid quota. Do not assume the same data-use rule for every developer location.
3. **Separate distribution restriction:** the terms allow **only Paid Services** when making API clients available to users in the EEA, Switzerland, or UK. The preceding data-use exception is not permission to offer a worldwide Free-tier client.
4. **Age/audience restriction:** the developer must be 18+, and the service cannot be part of a client directed towards or likely to be accessed by under-18s. A warning, checkbox, or geolocation hint alone is not a certification of compliance.

A privacy notice, the owner's consent, PII regex, or preset queries alone cannot close all these gates. An unrestricted worldwide Google Free launch is **not approved**. These are implementation/release constraints, not a legal compliance certification.

## Solution options

| Option | What it solves | Remaining cost/privacy/runtime trade-off | Status |
|---|---|---|---|
| **A. Evaluate another hosted Free provider: Groq + Zero Data Retention (ZDR)** | Candidate for a publicly usable demo without model-training use of queries. Groq's agreement prohibits training/fine-tuning on inputs/outputs unless the customer grants permission. | Prompts still leave our server and are processed externally. Confirm actual Free/no-payment status, ZDR availability/settings, model license, audience/regions, quota, and structured-output/token-budget feasibility. | Contingency only if Google is declined or unsuitable; not an approved migration. |
| **B. Local inference with Ollama, local models only** | Avoids sending inference prompts to a hosted model provider; supports genuine live demonstrations on an existing computer. | Hardware/RAM, model license, download size and latency need evaluation. Not a drop-in, always-on Vercel deployment; Vercel cannot reach a user's localhost. Do not expose an unauthenticated local model or create a tunnel. | Privacy-first alternative if external processing itself is unacceptable; architecture approval required. |
| **C. Continue with approved Google, for an eligible audience and accepted applicable terms** | Reuses the implemented planner and existing tests. Optional server-enforced presets reduce accidental submission of arbitrary personal text. | Google still receives inputs/outputs under the applicable terms. Privacy acceptance and an audience/region-compliant distribution design remain necessary. Presets are not a no-training/no-review solution and would change free-text scope if required. | Current baseline, not yet authorized for activation; presets are optional, not an already agreed requirement. |

Paid Gemini is outside the current constraints. Simply leaving AI disabled is a temporary safety state, **not** the portfolio's final acceptance criterion. A recorded local demonstration can show real execution if clearly labeled, but does not substitute for a publicly interactive AI feature unless the user agrees to that scope change.

### Groq candidate: important qualifications

- Official billing docs distinguish Free from the paid Developer tier; upgrading requires a payment method. Verify the real account stays Free without adding one; do not assume any model or quota is free merely because an endpoint responds.
- Its data docs say inference content is not retained by default, but reliability/abuse logs may retain inputs/outputs for up to 30 days, or longer when legally required. Optional persistence features retain content too.
- The data docs say all customers may enable ZDR; the services agreement refers to eligible customers. Confirm the actual Free account exposes the control and enable it before any trial. Keep persistence features disabled and do not grant training/data-sharing permission.
- ZDR is not zero processing, zero metadata, or a guarantee against every lawful disclosure/access. Groq always retains usage metadata. Its docs locate retained customer data in **US Google Cloud Platform buckets**; this is not a promise of no Google infrastructure or subprocessors, nor the same policy as sending data to Gemini Free for improvement.
- Review age/end-user, geography, DPA/transfer and selected-model terms, plus any feature-specific logging/caching behavior. Do not claim anonymous worldwide use or legal compliance from the privacy page alone.
- No Groq account/key/model has been configured or selected. The previously approved Gemini model remains the only approved model; it is still disabled.

## Execution sequence and acceptance gates

### D1 — Clarify the applicable Google terms and intended audience

- [x] Developer confirms Brazil/LatAm and accepts unpaid-service content improvement/possible human review after the explanation. Keep Google and the approved model.
- [x] Establish intended UX: public access without invitations/accounts/link requests; expected audience is recruiters, not a verified visitor restriction.
- [ ] Resolve compatibility of that public distribution with the provider's audience/region conditions. Do not equate the operator's Brazil location or low traffic with restricted eligible access; no geographic restriction has been approved.
- [ ] Only if Google is declined or unsuitable: choose the acceptable external-processing boundary and obtain explicit approval before evaluating a migration/architecture change as execution work. Alternatives below are reference material, not the default next task.

### D2 — Complete the approved Google release design without inference

- [ ] Use existing operator Free/no-payment and quota confirmations; clarify only missing selected-model/account or audience details. Do not repeat completed setup tasks or demand dashboard access/secret screenshots.
- [ ] Define an eligible distribution/access design and accurate notice. Stop if satisfying it requires payments or conflicts with the intended portfolio audience; bring that concrete conflict to the user rather than imposing a migration.
- [ ] Identify the minimal production activation wiring for both existing interlocks. Reuse the Google adapter and its existing exact-request token preflight; no new provider abstraction or token-accounting redesign is necessary to continue with Google.

### D3 — Finish activation wiring and disclosure with mocks, after approval

- [x] Wire the existing planner's trusted server assertion at production composition, derived from server availability (still false). No request/browser approval fields; Search/Quality contracts stay intact.
- [x] Production-composition mocks and existing tests pass: 348 tests, with five opt-in Redis cases skipped; lint/typecheck/build pass. Disabled defaults, approval after admission, denied admission and browser override rejection are covered; existing provider/handler regressions remain green. No provider calls.
- [x] Expand the pt-BR notice with unpaid-service improvement use/possible human review and link to official terms. Existing quota/startup guidance and free-text scope stay.

If an alternative is explicitly chosen later, revise D2–D3 for that provider first. A non-Google adapter needs approved model/license/privacy settings and safe provider-correct pre-request token accounting; a local model needs hardware/download/license approval and must not silently expose localhost or a public tunnel. None of that work is necessary just to explain or continue the current Google plan.

### D4 — Verify runtime paths without activating generation

- [ ] Agree on an **operator-only/protected** Vercel runtime check for Render and isolated Upstash access. Use fixed targets and minimal aggregate results; no public diagnostic, browser-held secret, arbitrary URL, production-counter reset, or keep-alive polling. Approve any temporary deployment/code surface first, then remove it or retain deliberate operator protection.
- [ ] Measure the approved runtime check after a quiet window and choose an explicit demo cold-start policy: bounded first-request failure may be acceptable **only with operator acceptance and honest UI**. Do not promise all Render Free wake-ups fit in 20s, increase time budgets silently, or add automatic retries.

### D5 — One controlled inference, then a deliberate public release

- [ ] Obtain **separate explicit authorization** for one real inference using a public-film-only example and the selected provider/model. This authorization is not supplied by the plan update or by authorization for MCP checks. Reserve admission if using the enabled route; do not bypass/reset shared limits to test.
- [ ] Verify planner→Render/MCP→Quality, schema-only presentation, latency and reported usage; do not log prompts, credentials or raw errors. Stop on failure rather than retrying automatically.
- [ ] Close applicable provider/privacy/audience/region and cold-start gates, then obtain public activation approval. Keep one global admission/60s and ten/rolling 24h, no refunds or fallback.
- [ ] Deploy and smoke-test the actual enabled path, quota errors and disable/rollback switch. Close Phase 6 only with an honestly documented usable demo and accepted limitations, or an explicitly approved scope amendment.

## Primary sources

Read-only documentation reviewed on 2026-10-29; no inference endpoint was called:

- [Gemini Additional Terms — age, regions, unpaid/paid data use](https://ai.google.dev/gemini-api/terms)
- [Gemini rate limits — RPM, input TPM, RPD, project scope](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Groq Services Agreement — sections 2, 4.2 and 6; model and end-user obligations](https://console.groq.com/docs/legal/services-agreement)
- [Groq data retention, ZDR, metadata and data location](https://console.groq.com/docs/your-data)
- [Groq Free/Developer billing distinction](https://console.groq.com/docs/billing-faqs)
- [Groq structured outputs — support depends on model/mode](https://console.groq.com/docs/structured-outputs)
- [Ollama FAQ — local-only operation and disabling cloud features](https://docs.ollama.com/faq)
