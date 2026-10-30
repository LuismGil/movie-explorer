# AI Portfolio Demo — Privacy and Activation Decision

Updated: **2026-10-30**. **Latest execution: the operator separately authorized one real test, which passed.** A private local-handler invocation used live Google/Upstash/Render, consumed one admission and returned 12 Quality-approved movies with 237 model tokens in 4.275s. No retries or public activation; that single-test permission is consumed. The AI-only geographic gate is now implemented; adult-audience eligibility, cold-start acceptance and enabled Vercel/browser release verification remain open. [Evidence](AI_LIVE_CHECK.md).

This decision supersedes the earlier clarification-stage narrative below. Do not repeatedly ask for privacy acceptance or infer a demo exemption. The operator's location does not establish visitor location or age.

**Subsequent UX decision:** the user chooses direct public demo access, rejecting invitations, account creation and contacting the owner for a link. Keep that requirement. A Brazil-only restriction was suggested but not approved or implemented. This settles the intended UX, not worldwide provider eligibility; do not silently introduce access friction or claim the quota solves distribution conditions.

**Geographic gate approved and implemented (2026-10-30):** keep the movie catalog public worldwide; restrict only AI requests from the EEA, Switzerland and the United Kingdom. Missing, malformed or unknown Vercel country data fails closed for AI only. The server applies this check before shared admission, and `/discover` explains the restriction with a catalog link. The public AI flag remains false. This country/IP policy is an approximation, does not verify a visitor's age/residency, and does not close the separate adult-audience terms gate.

**Implemented quota experience:** shared admission remains one/60s and ten/rolling 24h. A denied request shows a real hours/minutes/seconds countdown using server `Retry-After`, explains the shared limit, and offers the normal catalog. It updates after tab suspension and enables manual retry when the wait ends. No polling, automatic inference, midnight reset or guaranteed available slot. The countdown is outside the live status region to avoid announcing every second. Latest local lint/types/build and 369 tests pass (five opt-in Redis cases skipped); generation remains publicly disabled. One separately authorized live provider call subsequently passed; see [`AI_LIVE_CHECK.md`](AI_LIVE_CHECK.md).

## Plan review: what is actually incomplete?

The architecture and fixed `gemini-3.1-flash-lite`/no-fallback model policy were explicitly approved on 2026-10-22. Those approvals remain valid. The same plan separately left provider access, Free eligibility, privacy and live integration pending. **Unresolved is not rejected:** the user's questions about privacy do not withdraw Google approval or select a replacement.

The earlier strategic blueprint (`movieexplorer-implementation_plan-v2.md`) assumed Gemini Pro/Flash and estimated token costs; it did not establish a universally Free, private, globally eligible deployment. The authoritative execution plan later approved the single-model design and deterministic Search/Quality. There is no need to restart those completed implementation units.

The planning/communication gap was reporting “entry approvals complete” without making the remaining release conditions equally clear. The age/region implications were explained too late, and recommending migration before clarifying the user's privacy boundary was premature. They are existing published conditions now identified, **not evidence of a newly changed Google policy or a broken deployment**.

| Area | Current evidence | Actual remaining work |
|---|---|---|
| Architecture/model | Approved; implemented with mocked provider tests | Retain Google; do not reopen or migrate by default. |
| Existing Free/no-payment plans and eviction | Operator confirmed | Record that confirmation; do not repeatedly request the same confirmation. |
| Google privacy/distribution | Operator in Brazil accepts unpaid-service data use; AI-only EEA/CH/UK/unknown-country block implemented; adult-audience eligibility unresolved | Resolve adult-audience/terms eligibility; do not repeat the operator's privacy decision or widen restrictions without approval. |
| Public activation wiring | Route supplies the Google assertion from server-owned availability; production-composition mocks pass; public gate remains false | Close release gates and obtain explicit activation approval before enabling. |
| Live provider/runtime behavior | Vercel dependency checks passed; one authorized real local Google→Search→Quality/stream invocation passed (237 tokens, 4.275s); new geo gate unit/composition tests pass | Confirm Vercel/old-diagnostic-deployment cleanup and verify geolocation behavior in a non-generative Vercel check; deliberately scope full enabled AI verification only after release decisions. |
| Render startup | Observed 13.889s; init cap now 20s | Agree on bounded demo startup behavior; no need to promise a production SLA or replace hosting automatically. |

**Direct answer:** Gemini must receive the submitted prompt to perform hosted inference. In the general Unpaid Services arrangement Google also uses content for improvement and may have humans review it; the regional exception below matters. There is no application-code switch that overrides those terms. If the user declines the applicable content-use terms, that **Google Free arrangement** cannot be activated under the current constraints. It does not disable the movie application or rule out all AI. Clarify the applicable terms first; only then consider a different route if necessary.

## Goal and non-negotiables

Deliver a usable portfolio demonstration of **real inference**, not permanently disabled AI or canned results presented as live generation. Preserve the current supported movie intents; do not promise a general-purpose assistant or unsupported genre/mood filtering.

- Free Tier only: no card, bank/debit payment method, paid upgrade, or expiring-credit dependency.
- The user in Brazil has accepted Google's unpaid-service data use and asked to proceed. Record that decision without assuming every future visitor is eligible or treating demo status as an exemption.
- No provider switch, model download, new account, dependency or new production diagnostic is authorized. The separately approved first real inference is complete; additional inference/public activation needs deliberate scope, not automatic repetition.
- Keep both public AI availability and Google activation disabled until the selected route's gates pass. No automatic provider/model fallback.
- Phase 6 stays open; Phase 7 does not start. Any different phase order requires explicit approval.

## Evidence already available

- Commit `5419f86` is pushed; the user confirmed Vercel Ready. That historical smoke returned `/discover` HTTP 200 and `POST /api/ai/search` HTTP 503 `disabled`, with `no-store, no-transform`, and did not exercise dependencies. D4 later checked Vercel→Upstash/Render; the separate D5 real inference was local, not from Vercel.
- The user confirms all currently configured services are Free with no cards/payment methods, and Upstash eviction is disabled. Dashboards were not independently inspected; do not repeatedly treat the operator's confirmation as missing.
- Hosted Upstash PING and isolated temporary-key EVAL passed locally, without touching the production admission key. D4 later passed isolated Upstash checks and a fixed authenticated Render/MCP search from Vercel; D5 consumed one production admission for the one authorized local live-handler test. Separately, all five authenticated read-only Render tools passed through the local app adapter.
- The observed initialize-only Render handshake took 13.889s after a 16-minute no-agent-request window; outside traffic was unobservable. Initialization is now capped at 20s, inside the unchanged 30s pipeline and 35s route/UI bounds. Longer wake-ups remain possible.
- AI Studio values reported by the user: `0 / 60`, `0 / 100K`, `0 / 100`, apparently usage/limits for RPM, input TPM, and RPD respectively. This is not an independent check of the selected model/project or provider access.
- One live Google token-counting request and one generation both returned HTTP 200 in the separately authorized local test. Real shared admission, Search/Quality and stream validation passed; no public availability/source/env change occurred. Last full source verification remains lint/types/build and 349 tests; this evidence-only update does not claim a new suite run.

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
- [x] Operator approves and implementation adds an AI-only block for the EEA, Switzerland, the United Kingdom, and unknown geolocation; the catalog remains public worldwide. No inference/public activation is enabled by this policy change.
- [ ] Resolve adult-audience eligibility and verify in a non-generative Vercel check that the country signal is platform-derived and cannot be overridden by a client header. The operator's Brazil location and the country gate do not establish visitor age or residency.
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

- [x] Operator explicitly approved a temporary token-protected check: fixed Upstash PING/isolated-key EVAL (5s expiry), fixed Inception search through the Render app adapter, no Google/real-counter access, caller-selected targets, retries or availability change. Implemented locally with a new optional server-only `AI_RUNTIME_CHECK_API_KEY`; lint/types/build and 394 mocked tests plus local production auth/override/disabled-AI smoke pass. [Setup and mandatory retirement](AI_RUNTIME_CHECK.md).
- [x] Hosted execution passed after `811d956` deployment and private settings corrections: operator output reports Upstash 83ms, MCP 928ms, total 1,015ms. A preceding attempt had Upstash failed/133ms and MCP passed/12,393ms; its precise failure cause is unknown. Both runtime paths now have successful evidence. No Google or real-counter access. [Evidence](AI_RUNTIME_CHECK.md).
- [x] Remove temporary diagnostic route, implementation/tests, caller/helper/tests, command and example key locally. Lint/types/build, 349 remaining tests and local production 404/disabled-AI smoke pass.
- [x] Publish retirement `e8b314c` and verify credential-free production GET/POST to the diagnostic route both return 404.
- [x] Confirm local diagnostic-key removal by presence-only check; the key is absent from `.env` and its value was not read.
- [ ] Confirm Vercel diagnostic-key removal and handle older diagnostic deployments with approval for destructive cleanup.
- [ ] Choose an explicit demo cold-start policy using the recorded evidence. The successful hosted check had no confirmed quiet window; bounded first-request failure may be acceptable **only with operator acceptance and honest UI**. Do not promise all Render Free wake-ups fit in 20s, increase time budgets silently, or add automatic retries. Any additional live measurement needs deliberate scope rather than restoring the retired diagnostic by default.

### D5 — One controlled inference, then a deliberate public release

- [x] Obtain **separate explicit authorization** for one real Inception search with the selected Google/model, quota enforced, public availability off and no retries. One real admission was consumed; no bypass/reset/refund.
- [x] Verify the real local handler's planner→Render/MCP→Quality flow and stream consumer: completed/approved, 12 movies including the expected film, 214 input/23 output/237 total tokens, 4,275ms overall, exactly one token preflight and generation. No raw data logged, no retries, executable removed after use. [Detailed scope](AI_LIVE_CHECK.md). This test was local, not an enabled Vercel/browser invocation.
- [ ] Close applicable provider/privacy/adult-audience and cold-start gates, then obtain public activation approval. The AI-only region gate is in place. Keep one global admission/60s and ten/rolling 24h, no refunds or fallback.
- [ ] Deploy and smoke-test the actual enabled path, quota errors and disable/rollback switch. Close Phase 6 only with an honestly documented usable demo and accepted limitations, or an explicitly approved scope amendment.

## Primary sources

The source review itself was read-only and made no inference request; the separately authorized D5 execution is documented above:

- [Gemini Additional Terms — age, regions, unpaid/paid data use](https://ai.google.dev/gemini-api/terms)
- [Gemini rate limits — RPM, input TPM, RPD, project scope](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Groq Services Agreement — sections 2, 4.2 and 6; model and end-user obligations](https://console.groq.com/docs/legal/services-agreement)
- [Groq data retention, ZDR, metadata and data location](https://console.groq.com/docs/your-data)
- [Groq Free/Developer billing distinction](https://console.groq.com/docs/billing-faqs)
- [Groq structured outputs — support depends on model/mode](https://console.groq.com/docs/structured-outputs)
- [Ollama FAQ — local-only operation and disabling cloud features](https://docs.ollama.com/faq)
