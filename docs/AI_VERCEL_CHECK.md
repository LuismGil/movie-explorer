# Authorized Vercel/Browser AI Attempts — 2026-11-09

**Outcome: inconclusive; R7 remains open.** Two separate one-attempt authorizations produced two browser POSTs in two sessions. Neither has a verified terminal result and clean EOF. The second session observed exactly one POST with no duplicate, but retained no response status/body; the script emitted a generic error and the overall command later exceeded its 100-second timeout. The underlying error/lingering-process cause was not captured. No third POST, retry, quota reset, or new deployment was made. Treat both admissions and any generation as potentially consumed.

## Scope and observed evidence

- Target: `https://movie-explorer-luis.vercel.app/discover`.
- The page returned HTTP 200. Before interaction, the 18+ checkbox was unchecked and the input/submit controls were disabled. After checking it and entering the non-personal query “Filmes de ficção científica com mistério parecidos com Inception”, the submit control became available.
- One submit generated exactly one observed POST. Its response was HTTP 200, `application/x-ndjson; charset=utf-8`. No duplicate was observed; no browser page error was recorded.
- At the end of observation the status region still displayed “Preparando o serviço”; there were zero movie result cards. The browser did not verify a terminal success/error event or clean EOF.

## Second separately authorized attempt

- The operator explicitly authorized one new non-personal attempt. The production page and adult-declaration flow passed preflight; the browser submitted “Filmes parecidos com Inception”.
- The Playwright route guard observed exactly one `POST /api/ai/search`; no duplicate was attempted. The script matched a response but failed while awaiting/reading its completion and emitted only a generic `Error`; it did not retain the response status/body. The overall shell command later exceeded its 100-second limit. The exact failure and lingering-process cause were not captured.
- The second attempt's API HTTP status, content type, response body, terminal event, and EOF were not captured. No movie count or success can be claimed. No page error was recorded.
- The harness output does not distinguish a server-side stream failure from a client/transport/cleanup problem. Do not rerun; this attempt's authorization is consumed.

## Why this is inconclusive

The temporary browser check waited for a literal `.pending` class, but the UI uses a CSS-module-generated class. That condition therefore returned before the stream completed. The browser was closed while the UI still indicated preparation. This was a test-harness observation error; the captured evidence does **not** establish that the application itself failed, nor does it establish that the request completed successfully.

For **each** attempt, the available evidence cannot determine whether the shared admission was consumed or whether the request reached Google's token preflight/generation. Conservatively treat each admission as potentially consumed and a generation as potentially attempted. Do not reset/refund quota. Both one-attempt authorizations are consumed; no further inference is authorized by them.

## What this does and does not establish

- The first attempt confirms the deployed `/discover` page and AI endpoint were reachable, and one browser request received an HTTP 200 NDJSON response. The second confirms the page reached the one-submit state and one POST was observed, but did not retain its response status.
- Does **not** verify the full pipeline, Google generation, Search/Quality results, clean EOF, successful user experience, quota behavior, or general Vercel reliability. R7 remains open.
- Neither attempt initiated a deployment. Production GET evidence does not independently confirm a Vercel dashboard Ready state or GitHub Actions result for the shell candidate.
- The prior local live invocation remains separate evidence in [AI_LIVE_CHECK.md](AI_LIVE_CHECK.md). The audience decision and its residual public-access uncertainty are recorded in [AI_RELEASE.md](AI_RELEASE.md).
