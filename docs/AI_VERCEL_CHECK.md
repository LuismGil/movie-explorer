# Authorized Vercel/Browser AI Attempts — 2026-11-09

**Latest outcome: R7 passed for the tested title-selection path.** After two inconclusive checks, the operator authorized one new attempt using the offline-validated observer. It made exactly one production POST, received HTTP 200 NDJSON, and rendered **12 movie choices** with “Qual destes filmes?” after the application's stream reader validated the terminal result through EOF. Total browser-check elapsed time was **3,014ms**. This establishes the enabled Vercel/browser pipeline through a `needs_selection` result, not the subsequent recommendation after selecting a movie or general reliability. No follow-up selection, retry, reset or deployment was performed.

## Third authorized attempt — successful observed result

UTC timestamp: **2026-11-10T00:33:48.586Z–00:33:51.600Z** (2026-11-09 evening in Brazil). Target: `https://movie-explorer-luis.vercel.app/discover`; non-personal prompt: “Filmes parecidos com Inception”.

| Observation | Result |
|---|---|
| Page / API HTTP status | 200 / 200 |
| API content type | `application/x-ndjson; charset=utf-8` |
| Observed POSTs / duplicate attempted | **1 / no** |
| Terminal UI | `Qual destes filmes?` |
| Rendered movie choices | **12** |
| Client-validated terminal result through EOF | **Yes**, evidenced by real UI result rendering |
| Observation error | None |
| Elapsed browser check | **3,014ms** |
| Playwright network failure notification | `net::ERR_ABORTED` |

The network notification is retained rather than hidden: the capture does not establish its cause or exact ordering relative to result rendering. Despite that notification, the UI reached a valid result. `AIChatPanel` only renders these cards after `readAiStream` accepts the ordered preparation/planning/searching/validating sequence, schema-valid terminal result, and EOF; it does not render intermediate/canned results. EOF is evidenced by that client contract, **not** a separately captured raw-response trace. Do not describe network teardown as error-free.

No server/provider telemetry or billing dashboard was inspected; exact token usage, individual upstream request counts and billing are not independently certified. No actual idle/cold-start window was established. The `needs_selection` terminal is a supported successful pipeline outcome; a second selection would consume another admission and was not sent. R6 and the other release gates remain separate.

Sanitized local receipt: `/tmp/opencode/movie-explorer-r7-third-2026-11-09.json`. The one-shot runner used an exclusive receipt file to prevent accidental replay; the reusable observer is in `scripts/check-ai-browser.ts`, whose default command runs offline fixtures only. The third authorization is consumed; no further inference is implied.

## Historical first attempt — inconclusive

- Target: `https://movie-explorer-luis.vercel.app/discover`.
- The page returned HTTP 200. Before interaction, the 18+ checkbox was unchecked and the input/submit controls were disabled. After checking it and entering the non-personal query “Filmes de ficção científica com mistério parecidos com Inception”, the submit control became available.
- One submit generated exactly one observed POST. Its response was HTTP 200, `application/x-ndjson; charset=utf-8`. No duplicate was observed; no browser page error was recorded.
- At the end of observation the status region still displayed “Preparando o serviço”; there were zero movie result cards. The browser did not verify a terminal success/error event or clean EOF.

## Historical second separately authorized attempt — inconclusive

- The operator explicitly authorized one new non-personal attempt. The production page and adult-declaration flow passed preflight; the browser submitted “Filmes parecidos com Inception”.
- The Playwright route guard observed exactly one `POST /api/ai/search`; no duplicate was attempted. The script matched a response but failed while awaiting/reading its completion and emitted only a generic `Error`; it did not retain the response status/body. The overall shell command later exceeded its 100-second limit. The exact failure and lingering-process cause were not captured.
- The second attempt's API HTTP status, content type, response body, terminal event, and EOF were not captured. No movie count or success can be claimed. No page error was recorded.
- The harness output does not distinguish a server-side stream failure from a client/transport/cleanup problem. Do not rerun; this attempt's authorization is consumed.

## Why the first two attempts were inconclusive

The temporary browser check waited for a literal `.pending` class, but the UI uses a CSS-module-generated class. That condition therefore returned before the stream completed. The browser was closed while the UI still indicated preparation. This was a test-harness observation error; the captured evidence does **not** establish that the application itself failed, nor does it establish that the request completed successfully.

For **each of the first two** attempts, the available evidence cannot determine whether the shared admission was consumed or whether the request reached Google's token preflight/generation. Conservatively treat each admission as potentially consumed and a generation as potentially attempted. Do not reset/refund quota. Those one-attempt authorizations are consumed; the third attempt above was separately authorized.

## Historical limits of the first two attempts

- The first attempt confirms the deployed `/discover` page and AI endpoint were reachable, and one browser request received an HTTP 200 NDJSON response. The second confirms the page reached the one-submit state and one POST was observed, but did not retain its response status.
- Those first two attempts did **not** verify pipeline completion or EOF. The third attempt above supersedes their inconclusive R7 status, not their missing evidence. Quota-error handling, subsequent selection/recommendations and general reliability are not certified by the successful title-selection sample.
- Neither attempt initiated a deployment. Production GET evidence does not independently confirm a Vercel dashboard Ready state or GitHub Actions result for the shell candidate.
- The prior local live invocation remains separate evidence in [AI_LIVE_CHECK.md](AI_LIVE_CHECK.md). The audience decision and its residual public-access uncertainty are recorded in [AI_RELEASE.md](AI_RELEASE.md).
