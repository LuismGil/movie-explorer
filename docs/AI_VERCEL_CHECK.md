# One Authorized Vercel/Browser AI Attempt — 2026-11-09

**Outcome: inconclusive; R7 remains open.** The operator authorized exactly one non-personal production search after the R4 audience decision. The browser made exactly one `POST /api/ai/search`. Vercel returned HTTP 200 with an NDJSON content type, but the browser still showed “Preparando o serviço”; no result, terminal event, or clean stream EOF was verified. No second POST, retry, quota reset, or new deployment was made.

## Scope and observed evidence

- Target: `https://movie-explorer-luis.vercel.app/discover`.
- The page returned HTTP 200. Before interaction, the 18+ checkbox was unchecked and the input/submit controls were disabled. After checking it and entering the non-personal query “Filmes de ficção científica com mistério parecidos com Inception”, the submit control became available.
- One submit generated exactly one observed POST. Its response was HTTP 200, `application/x-ndjson; charset=utf-8`. No duplicate was observed; no browser page error was recorded.
- At the end of observation the status region still displayed “Preparando o serviço”; there were zero movie result cards. The browser did not verify a terminal success/error event or clean EOF.

## Why this is inconclusive

The temporary browser check waited for a literal `.pending` class, but the UI uses a CSS-module-generated class. That condition therefore returned before the stream completed. The browser was closed while the UI still indicated preparation. This was a test-harness observation error; the captured evidence does **not** establish that the application itself failed, nor does it establish that the request completed successfully.

The available evidence cannot determine whether the shared admission was consumed or whether the request reached Google's token preflight/generation. Conservatively treat the admission as potentially consumed and a generation as potentially attempted. Do not reset/refund quota. The one-attempt authorization is consumed; do not retry without new explicit authorization.

## What this does and does not establish

- Confirms the deployed `/discover` page and AI endpoint were reachable, and one browser request received an HTTP 200 NDJSON response.
- Does **not** verify the full pipeline, Google generation, Search/Quality results, clean EOF, successful user experience, quota behavior, or general Vercel reliability. R7 remains open.
- No deployment was initiated for this check. Production GET evidence does not independently confirm a Vercel dashboard Ready state or GitHub Actions result for the shell candidate.
- The prior local live invocation remains separate evidence in [AI_LIVE_CHECK.md](AI_LIVE_CHECK.md). The audience decision and its residual public-access uncertainty are recorded in [AI_RELEASE.md](AI_RELEASE.md).
