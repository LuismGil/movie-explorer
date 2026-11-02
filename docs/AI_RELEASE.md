# AI activation — 2026-11-02

**Subsequent publication:** commit `8819583` was created and pushed to `main`; the user reports its Vercel deployment **Ready**. This is operator-reported deployment state, not a new agent-run inference or certification of the known limitations. The user explicitly approved beginning Phase 7 with these limits carried forward. Source-preparation descriptions below predate that publication.

## Authorization and actual deployment state

The operator explicitly delegated the startup policy and age-control implementation, and authorized turning on AI. `src/server/ai/availability.ts` now exports `true` in the working tree. This supersedes earlier instructions to wait for activation authorization; it is **not evidence of a deployed release or provider-policy certification**. The operator reported the previous geo-gate commit pushed and its tests successful.

No new live inference, hosted probe, quota mutation/reset, credential change, payment, commit, push or deployment was performed for this change. The earlier one-off inference permission remains consumed; public activation authorization does not request another agent-run experiment. The operator asked to stop repetitive testing and postponed the Vercel geolocation experiment; do not silently restore diagnostics.

## Adult access: self-declaration, not age verification

- Only the AI panel requires a deliberately unchecked “18 or older” checkbox. Until confirmed, input/submission is disabled; visitors can choose the public catalog instead. There are no accounts, invitations, identity providers or document uploads.
- Every AI submission (including selection/manual retry) must include `x-ai-adult-declaration: 18-or-older-v1`. The server rejects missing/invalid declarations with HTTP 403 and `adult_confirmation_required`, before reading the body, shared admission, MCP initialization or Google requests.
- The browser keeps the declaration only in component memory. Reloading requires confirmation again. No date of birth, document, age record, identifier or declaration cookie is collected/stored. The declaration is not included in the prompt or provider request. Application logging/telemetry does not record it.
- **This is a user-controlled assertion, not authentication, verified age or proof that minors cannot access the feature.** The Gemini terms prohibit clients directed towards or likely accessed by under-18s; they do not endorse this checkbox as sufficient. Actual audience eligibility remains unestablished. Do not describe activation or the gate as a legal/provider-compliance certification.

Official terms re-read on 2026-11-02: [Gemini age requirements](https://ai.google.dev/gemini-api/terms#age-requirements).

## Startup policy selected under operator delegation

Use bounded, demand-driven startup instead of keep-alive polling, a cron, background warm-ups, longer deadlines or paid infrastructure:

1. Check same-origin/JSON/size headers, the existing regional restriction and the adult declaration.
2. Validate the bounded request and obtain the normal shared admission.
3. Enter the real `preparing` stage. The production composition initializes/reuses the existing process-local MCP connection **before transmitting the prompt to Google**. An unavailable backend stops the request without token preflight or generation. No tool is called by preparation.
4. Planning, Search and Quality continue under the same total deadline. The complete result requires ordered `preparing → planning → searching → validating` progress and clean EOF.

MCP initialization remains capped at 20s, total orchestration at 30s and route/client at 35s; per-tool cap is still 10s. After 8s in server-reported preparation, the UI offers cancellation/catalog access and explains the wait. There is no fabricated percentage or automatic retry. An admitted failed/cancelled startup still consumes the existing shared reservation; later manual retries need a fresh admission. No startup SLA is claimed: longer Free-tier wake-ups can still fail.

## Unchanged safeguards and known limits

- Catalog access remains public worldwide. The AI-only EEA/CH/UK/unknown-country restriction is unchanged. Its use of Vercel's country header is implemented/tested locally; deployed resistance to header spoofing remains **unverified**, not waived into a pass.
- Shared limits remain one admission/60s and ten/rolling 24h. No refunds, counter namespace changes, resets, alternate model or paid fallback.
- The approved Google model, exact-request token preflight, token ceilings, no-store behavior, Quality-only presentation and existing data-use notice remain in force.
- Vercel diagnostic-key removal/older diagnostic-deployment cleanup and full enabled Vercel/browser behavior remain unverified. No old deployment was deleted.

## Disable / rollback

Set `aiDiscoveryEnabled = false` in `src/server/ai/availability.ts`, then deploy that change. The same server-owned switch disables the panel/public pipeline and the trusted Google assertion. Do not clear Redis history when disabling or re-enabling. Provider credentials alone cannot turn AI on; a client declaration cannot override the switch, region restriction or quota.

## Local implementation checks

Lint, typecheck and production build pass; `/discover` is now dynamically rendered for the country decision. The five affected mock-only suites pass **183 tests** (the cancellation test was corrected to await preparation entry and that suite re-run). No full-suite, opt-in Redis, hosted/browser experiment or live Google run was repeated. Coverage includes undeclared-adult denial before body/admission, unchanged region/quota/disable gates, exact request-header separation from the prompt, declaration withdrawal/remount, preparation-before-planning, startup failure/cancellation/deadline and UI wait/cleanup without extra network requests.
