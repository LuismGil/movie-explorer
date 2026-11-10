# AI activation and release limits — updated 2026-11-09

**Publication evidence:** activation commit `8819583` was pushed and its Vercel deployment was reported **Ready** by the operator. Later, after R2 commit `3fe0b6b` was pushed, production GETs served the new shell and `/discover` returned HTTP 200. This confirms the content was reachable, but is not an independent dashboard check of the `3fe0b6b` deployment's Ready state. R5's separately scoped production country-header spoof check passed; [evidence and limitations](AI_GEO_CHECK.md). Two separately authorized one-POST R7 browser attempts were inconclusive; see [attempt record](AI_VERCEL_CHECK.md). R6 remains open; these observations do not certify general reliability.

## Authorization and actual deployment state

The operator explicitly delegated the startup policy and age-control implementation, and authorized turning on AI. `src/server/ai/availability.ts` exports `true`; production `/discover` and the AI route were reachable during the R7 attempt. The flag alone is not deployment evidence, and the incomplete stream is not provider-policy certification. The operator reported the previous geo-gate commit pushed and its tests successful.

The one local live inference is historical evidence in [AI_LIVE_CHECK.md](AI_LIVE_CHECK.md). Two distinct, expressly authorized one-POST hosted attempts are recorded in [AI_VERCEL_CHECK.md](AI_VERCEL_CHECK.md); each may have consumed the normal shared admission and/or reached generation, and neither was reset/refunded. The separate R5 country-header check was non-generative and is recorded in [AI_GEO_CHECK.md](AI_GEO_CHECK.md). Both R7 authorizations are consumed; no extra inference, retry, credential change, payment, deployment or diagnostic restoration is authorized.

## Adult audience decision and access control

On 2026-11-09, the operator stated the expected audience is generally adults. The AI feature is positioned as an adult portfolio/technical demo and is not intended or marketed to minors. Based on those supplied facts, the release decision is that the feature is not directed to and is not likely to be accessed by under-18s. Public access means a minor cannot be ruled out; this is a reasoned audience assessment, not a guarantee or provider/legal certification. Reassess and disable Google access or choose an eligible distribution/provider if credible audience evidence changes.

- Only the AI panel requires a deliberately unchecked “18 or older” checkbox. Until confirmed, input/submission is disabled; visitors can choose the public catalog instead. There are no accounts, invitations, identity providers or document uploads.
- Every AI submission (including selection/manual retry) must include `x-ai-adult-declaration: 18-or-older-v1`. The server rejects missing/invalid declarations with HTTP 403 and `adult_confirmation_required`, before reading the body, shared admission, MCP initialization or Google requests.
- The browser keeps the declaration only in component memory. Reloading requires confirmation again. No date of birth, document, age record, identifier or declaration cookie is collected/stored. The declaration is not included in the prompt or provider request. Application logging/telemetry does not record it.
- **This is a user-controlled assertion, not authentication, verified age or proof that minors cannot access the feature.** It is a supporting friction/disclosure measure, not the basis of the audience determination by itself. The Gemini terms prohibit clients directed towards or likely accessed by under-18s. The eligibility decision above relies on the operator's stated expected audience and adult-oriented purpose; it remains subject to reassessment if those facts change. Do not describe the gate as age verification or a legal/provider-compliance certification.

Official terms re-read on 2026-11-09: [Gemini age requirements](https://ai.google.dev/gemini-api/terms#age-requirements).

## Startup policy selected under operator delegation

Use bounded, demand-driven startup instead of keep-alive polling, a cron, background warm-ups, longer deadlines or paid infrastructure:

1. Check same-origin/JSON/size headers, the existing regional restriction and the adult declaration.
2. Validate the bounded request and obtain the normal shared admission.
3. Enter the real `preparing` stage. The production composition initializes/reuses the existing process-local MCP connection **before transmitting the prompt to Google**. An unavailable backend stops the request without token preflight or generation. No tool is called by preparation.
4. Planning, Search and Quality continue under the same total deadline. The complete result requires ordered `preparing → planning → searching → validating` progress and clean EOF.

MCP initialization remains capped at 20s, total orchestration at 30s and route/client at 35s; per-tool cap is still 10s. After 8s in server-reported preparation, the UI offers cancellation/catalog access and explains the wait. There is no fabricated percentage or automatic retry. An admitted failed/cancelled startup still consumes the existing shared reservation; later manual retries need a fresh admission. No startup SLA is claimed: longer Free-tier wake-ups can still fail.

## Unchanged safeguards and known limits

- Catalog access remains public worldwide. The AI-only EEA/CH/UK/unknown-country restriction is unchanged. Its use of Vercel's country header is covered by local policy tests and the scoped deployed spoof check in [AI_GEO_CHECK.md](AI_GEO_CHECK.md); that check does not establish location accuracy or behavior from every region/ingress.
- Shared limits remain one admission/60s and ten/rolling 24h. No refunds, counter namespace changes, resets, alternate model or paid fallback.
- The approved Google model, exact-request token preflight, token ceilings, no-store behavior, Quality-only presentation and existing data-use notice remain in force.
- Vercel diagnostic-key removal/older diagnostic-deployment cleanup remain unverified (R6); no old deployment was deleted. R5's hosted country-header spoof check has a single-vantage scope, not a physical restricted-region test. The two R7 browser attempts are documented separately; neither is a reliability or quota-error test.

## Disable / rollback

Set `aiDiscoveryEnabled = false` in `src/server/ai/availability.ts`, then deploy that change. The same server-owned switch disables the panel/public pipeline and the trusted Google assertion. Do not clear Redis history when disabling or re-enabling. Provider credentials alone cannot turn AI on; a client declaration cannot override the switch, region restriction or quota.

## Local implementation checks

Lint, typecheck and production build pass; `/discover` is now dynamically rendered for the country decision. The five affected mock-only suites pass **183 tests** (the cancellation test was corrected to await preparation entry and that suite re-run). No full-suite, opt-in Redis, hosted/browser experiment or live Google run was repeated. Coverage includes undeclared-adult denial before body/admission, unchanged region/quota/disable gates, exact request-header separation from the prompt, declaration withdrawal/remount, preparation-before-planning, startup failure/cancellation/deadline and UI wait/cleanup without extra network requests.
