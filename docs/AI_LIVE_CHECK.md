# First Controlled Live AI Check — 2026-10-29

**Result: passed. Public AI remains disabled.** The operator explicitly authorized one real public-film search using the approved `gemini-3.1-flash-lite`, with no retries and the shared admission limit intact. The single authorized attempt is complete; this is not permission to repeat it or activate public access.

## Execution boundary

The agent ran the existing `createAiSearchHandler` in a private local Node process with no HTTP listener, using its normal validation, hosted `enforceAiRateLimit`, `runOrchestrator`, Google adapter, Search/MCP, Quality and `readAiStream`. Only that in-process handler instance was enabled. The trusted Google assertion reflected the operator's existing Free/no-payment/privacy confirmations and this explicit one-test authorization. No public availability file, route, credential or environment file was changed.

Google, the configured Upstash database and the approved Render/MCP endpoint were real services, not mocks. A process-only default selected the documented Render endpoint when the local MCP URL was absent, matching the existing remote MCP checker. The normal fixed admission key/limits were used: one allowed admission was consumed and was not reset or refunded.

## Sanitized results

Telemetry timestamp: **2026-10-29T19:41:52.497Z**. The approved fixture searched for Inception; no raw prompt, model decision, movie payload, credential or upstream error was logged or retained in the receipt.

| Check | Result |
|---|---|
| Shared Upstash admission | Allowed; one admission |
| Exact-request Google `countTokens` | One attempt, HTTP 200, 917ms to response headers |
| Google `generateContent` | One attempt, HTTP 200, 872ms to response headers |
| Orchestrator | `completed`, one planner invocation, one tool slot reserved |
| Reported model usage | **214 input + 23 output = 237 total tokens** |
| MCP tool | One `search_movies`, zero failures; 427ms tool time |
| Quality | `approved`, **12 movies**, expected film present |
| NDJSON consumer | HTTP 200; ordered planning → searching → validating, then result; validated through clean EOF |
| Whole check | **4,275ms**, including admission, pipeline and connection cleanup |
| Public availability | `aiDiscoveryEnabled=false`, unchanged |

Stage telemetry: planner **1,818ms**, Search **1,923ms** (including MCP connection setup), Quality **8ms**; one call and zero failures per stage. Search and Quality consume no model tokens. No other MCP tool ran. No second model round, repair request, automatic retry or fallback occurred.

All default ceilings remained: 4,096 input / 512 output / 4,608 total tokens, 30s orchestration / 35s handler and 20s MCP initialization / 10s tool. The one-off runner had an exclusive execution receipt to prevent accidental replay. Its executable was removed afterward; only sanitized aggregate evidence was retained.

## What this proves and what remains

- This verifies real Google authentication/model access, token preflight, structured planning, shared admission, authenticated Search, Quality and the stream reader for this one local-handler invocation.
- It is **not** an enabled Vercel-function or browser UI test. D4 separately verified Vercel→Upstash/Render; these samples do not combine into proof of the full generative path on Vercel.
- No confirmed Render idle window was established. Bounded cold-start behavior still needs operator acceptance.
- Provider-reported usage is not billing reconciliation. Existing Free/no-payment confirmations stand; no billing/account settings were inspected or changed.
- Public audience/distribution conditions, public activation approval and a deliberately scoped enabled Vercel/UI verification remain open. Keep the public gate false until those release decisions are closed.
- Runtime source was unchanged. The last full local checks remain 349 passing tests (five opt-in Redis cases skipped), lint/types/build and diagnostic-retirement smoke; no redundant suite rerun is claimed for this evidence-only update.
