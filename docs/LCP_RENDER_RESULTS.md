# Render-path investigation

## R2 local closeout — 2026-11-06

The original acceptance criteria and `lighthouserc.json` are unchanged: mobile
simulated three-run **median LCP <1,200ms**, accessibility **100**, and
**CLS <0.05**. The prior R1/R3 commit is `4a4f1ce`. The R2 implementation and
this evidence are committed and pushed to `main` in the current session; no
application deployment or hosted verification was performed. The pre-existing
`PRD.md` and exact working-tree state of `next-env.d.ts` are preserved.

### Final implementation

- `proxy.ts` rewrites only root document GET requests accepting HTML to the
  dynamic `app/api/catalog-shell/route.ts` HTML handler. `app/page.tsx` remains
  intact and other App Router routes continue to serve detail, Discover and
  Watchlist pages.
- The shell renders TMDB results server-side and retains search, popular/trending
  and day/week filters, pagination, detail links and watchlist add/remove using
  the existing `movie-explorer:watchlist` localStorage contract. Browser
  navigation back to `/` deliberately requests the lightweight document shell.
- Canonical local Sora, Hanken Grotesk and JetBrains Mono UI subsets and the
  existing full-family Unicode fallbacks are preserved. Build/dev preparation
  copies font assets without changing the canonical sources. Font CSS is inlined
  with UI subset preloads; Hanken retains `font-display: swap`, and Sora/Mono
  retain `optional`. The HTML is explicitly gzip-compressed. No Next.js client
  runtime chunks are requested by the Home shell.
- Catalog responses are cached only in process memory, for 60 seconds, with at
  most 48 entries; in-flight requests are shared and failed entries evicted.
  This is not a cross-process/shared cache. Cold requests still wait for TMDB;
  measured cold response time was about 505–521ms, while warm responses were
  about 5–6ms in the LHCI batches.

### Unchanged-settings LHCI evidence

Two consecutive `npx lhci autorun --config=lighthouserc.json` batches against the
production standalone build passed. They used the original mobile simulated
throttle, assertions, metric and threshold; no Lighthouse configuration or
acceptance value was changed.

| Batch | LCP samples (ms, ascending) | Median LCP | Accessibility | CLS | Document transfer |
|---|---|---:|---:|---:|---:|
| 1 | 1,054.899 / 1,056.398 / 1,073.754 | **1,056.398ms** | 100 in all 3 | 0 in all 3 | 9,013 B each |
| 2 | 1,056.318 / 1,060.342 / 1,114.817 | **1,060.342ms** | 100 in all 3 | 0 in all 3 | 9,013 B each |

All six LCP samples are below 1,200ms. The HTML body is about 46KB before gzip;
Lighthouse reports its compressed transfer as 9,013 bytes. The median cold
response remains below the threshold in both batches; these results are local
simulated evidence, not field data or a hosted deployment claim.

### Flow, accessibility and project checks

- Production standalone Playwright smoke passed pagination, popular/trending,
  day/week, debounced search, movie detail, navigation back to the shell, and
  watchlist save, persistence on the React Watchlist route, and removal.
- Axe found no violations on the Home shell, movie detail or empty Watchlist.
  Local browser checks confirmed all three font families load, Home downloads no
  Next.js client chunks, and there are no page errors.
- `npm run build`, `npm run lint`, `npm run typecheck`,
  `npm test -- --run` (**424 passed; five opt-in Redis tests skipped**),
  `npm run check:client-bundle` and `git diff --check` passed.
- `next-env.d.ts` was compared against the pre-build snapshot and restored; the
  snapshot matches the final working-tree file. `PRD.md` was not edited.

R2 is **closed against the local acceptance gate only**. Its source is pushed,
but separate release requirements R4–R11 and hosted CI/deployment evidence
remain open in [the canonical plan](../.ai/PLAN.md).

---

## Earlier R2 candidate — 2026-11-06 (superseded)

The R2 acceptance criteria are unchanged: three-run mobile simulated Lighthouse
CI median **LCP <1,200ms**, accessibility **100**, and **CLS <0.05**. The local
R1/R3 commit is `4a4f1ce`; it remains unpushed. Pre-existing `PRD.md` and
`next-env.d.ts` working-tree changes are preserved.

### Retained changes and measurement

- Enabled Next.js Cache Components/partial prerendering and split the home page
  into a static intro plus a `Suspense`-streamed catalog/search section. Discover
  and movie-detail dynamic work is also placed behind `Suspense`; the detail route
  opts out of instant prerendering because the shared Header uses `usePathname()`.
- Disabled Link prefetch for `/discover` entry points so visiting the catalog
  does not fetch AI-route client code in advance. No inference endpoint was
  requested in the final Lighthouse runs.
- Added `content-visibility: auto` and intrinsic block sizes to movie cards. In
  the captured request summaries this reduced initial poster transfer from about
  **530KB to 271KB**, without an attributable LCP change; retain it as a resource
  saving, not as the R2 solution.
- With identical local standalone builds and unchanged LHCI settings, the
  pre-PPR three-run samples were **2,407.866 / 2,371.874 / 2,523.215ms** (median
  **2,407.866ms**). The latest retained PPR samples are **1,961.081 / 1,956.771 /
  1,955.983ms** (median **1,956.771ms**). This is a repeatable improvement, but
  still fails the unchanged **<1,200ms** gate by 756.772ms.
- After reverting the deferred-card experiment and restoring immediate
  server-rendered catalog results, the latest unchanged-settings LHCI samples were
  **1,959.532 / 1,963.354 / 2,374.207ms**, median **1,963.354ms** (763.354ms over
  budget). This does not materially change the retained PPR result or close R2.
- Latest run FCP samples were 911.081 / 906.771 / 907.992ms; accessibility was
  100 and CLS was 0 in all three runs. LHCI therefore failed only its LCP
  assertion. These are local simulated results, not field/device measurements.
- A separate single-run Lighthouse capture with equivalent mobile settings still
  selects `h1#catalog-title`; classic simulated LCP was 2,109.549ms, while the
  trace-derived observed paint was 104ms and its element-render-delay insight was
  98.593ms. This trace is the original, unthrottled navigation; Lighthouse's
  configured `simulate` mode estimates a different load. The values are therefore
  not contradictory, and the observed paint is not an acceptance result.
- In that diagnostic, Lighthouse's network tree contains the 18.75KB document
  and a 7.70KB stylesheet (154ms longest chain); its estimated LCP savings are
  30ms for render-blocking CSS and 150ms for 26.7KB of unused JavaScript in one
  72KB chunk. These are modelled opportunities, not proof of the 763ms gap's
  cause, and neither estimate alone is sufficient to close R2. No code change is
  selected from this evidence without attribution against the simulated metric.

### Further LCP attribution — 2026-11-06

- Using the installed Lighthouse **12.6.1** computation on the saved exact-run
  trace and DevTools log reproduces its simulated LCP exactly (**2,114.561ms**).
  The limiting simulated node is the common App Router runtime chunk
  `2ki52vdnbo2ft.js`: **72,438 transferred bytes**, request priority `Low`, ending
  at 2,114.561ms. In this Lighthouse version, Lantern's LCP estimate is the
  maximum simulated dependency-graph node end time, excluding low-priority
  images; nodes can represent network requests or CPU work. Thus the estimate can
  extend past the H1's observed paint when a non-image script is still
  transferring. This explains the mode discrepancy; it does not permit excluding
  that request or substituting the observed paint.
- Three diagnostic runs with the same mobile network/CPU values but
  `throttlingMethod=devtools` measured LCP/FCP **1,630.437 / 1,630.437ms**,
  **1,636.182 / 1,636.182ms**, and **1,663.207 / 1,663.207ms** (median LCP
  **1,636.182ms**, CLS 0). They identify the same H1; the 7,695-byte stylesheet
  completed at about 1,393ms, the three UI font files at 1,496–1,520ms, and first
  paint at 1,636ms. This alternate throttle is diagnostic, not the R2 gate; the
  prior inline-CSS and font-preload experiments remain rejected.
- A temporary `next build --webpack` was a bundle-size check, not a retained
  source/config change. It built with theme-token export warnings and emitted
  **451,336 raw bytes** across root runtime files versus **443,546 bytes** for
  Turbopack (+1.8%). No LHCI comparison was warranted; the final standalone
  production build was restored to the original Turbopack configuration.
- The retained three-run LHCI median remains **1,963.354ms**. In this exact
  diagnostic capture the framework runtime request is the final graph node; no
  safe application-level edit has yet shown it can reduce that path enough to
  meet 1.2s. Do not suppress Next.js scripts, alter Lighthouse settings, or call
  the DevTools/observed result a pass. Any further attempt needs a substantive,
  supported reduction to the client runtime path while preserving
  catalog/watchlist interactions.

### Experiments not retained

- A narrower server/client boundary for `MovieCard` did not measurably improve
  LCP and was reverted.
- Disabling body/mono font preloads increased median FCP to about **1,356ms**;
  it was reverted.
- Next's experimental global `inlineCss` increased the document transfer to
  about **46.8KB** and median FCP to about **1,077ms**, with no LCP improvement;
  it was reverted.
- Reducing the initial skeleton count did not show a reliable LCP benefit; the
  original eight-card loading state was restored.
- Reducing eager posters from four to two, then making all posters lazy, did not
  improve the median (1,960.890ms and 1,957.880ms versus the retained 1,956.771ms).
  All eight near-viewport images were still requested in the all-lazy sample, so
  the original eager policy was restored rather than delaying visible posters.
- Deferring cards after the first two, then deferring the whole grid by two
  animation frames, produced medians of 1,964.980ms and 1,959.773ms. The latter
  reduced document transfer about 2.6KB, with accessibility 100 and CLS 0, but
  did not improve LCP; it was reverted to preserve immediate server-rendered
  catalog results. A fresh LHCI batch after the revert remained noisy (median
  1,963.354ms) and still failed the original gate.

### Verification at this earlier candidate checkpoint

The final source passes lint, typecheck, build, **424 tests** (five opt-in Redis
tests skipped), and the client-bundle guard (17 files; zero issues). The local
axe audit found no critical/serious violations on Home, Watchlist, or Discover;
catalog/watchlist navigation smoke had no page errors and recorded **zero AI
search requests**. The final LHCI batch after reverting deferred rendering was
**1,959.532 / 1,963.354 / 2,374.207ms** (median **1,963.354ms**); accessibility
was 100 and CLS 0 in all three runs, so only LCP failed. `next-env.d.ts` was
restored after each build. No threshold,
metric, accessibility requirement, or flow was weakened.

**Status at this earlier checkpoint:** R2 was still open for the PPR candidate.
The local document-shell closeout at the top of this report subsequently met
the original gate; these failed measurements remain historical and are not the
final candidate's evidence. No push or deployment was made. Earlier post-font
trace evidence and the 2026-11-02 resource split follow.

---

## Render-path investigation — 2026-11-02

Implementation: local `6e50606`. The operator reports the earlier published
`c3a1cea` deployment Ready; this follow-up is **not pushed/deployed**. Scope and
unchanged acceptance conditions: [execution plan](LCP_RENDER_PLAN.md).

## What the trace establishes

The assembled post-font baseline was frozen before building the candidate,
excluding private environment files. Lighthouse 12.6.1 trace/devtools-log artifacts
and reconstructed Lantern node timings were saved, not only the audit report.

- The headline `h1#catalog-title` remains LCP. One baseline capture estimates
  LCP 2,419.966ms/FCP 915.966ms, versus **238ms observed without throttling**.
- The estimated critical tail contains framework chunks of 72,416 and 46,789
  transferred bytes, followed by a 154ms simulated CPU task. This does not prove
  that all that work blocks actual headline painting.
- A Paint event occurs at 225.807ms; the selected framework EvaluateScript task
  starts at 234.541ms and ends around 273ms. The presentation-based LCP timestamp
  falls inside that task. The model includes the complete selected task and its
  dependencies; do not mistake whole-task/whole-trace totals for pre-paint cost.
- The shared application/common chunk also contains all Discover-only copy.
  This is a safe, identifiable resource boundary to improve. It does not justify
  suppressing framework scripts, changing frameworks or replacing the headline.

## Retained resource change

`src/i18n/catalog.ts` and `src/i18n/ai.ts` are independent pt-BR dictionaries.
Catalog clients import only the former; Discover imports its own copy. The
complete `messages` API remains compatible through `src/i18n/messages.ts`.
All original strings and sampled formatter outputs match the previous source.
No wording, markup, styles, AI eligibility, admission or inference logic changes.
Font maintenance reads both dictionaries and produces **byte-identical** assets.

The existing bundle guard now checks the catalog's three declared entry chunks
for distinctive Discover-only copy keys. It parses JSON without executing the
generated manifest, rejects missing/invalid data and escaping paths, and permits
copy in separate Discover chunks. The frozen old build fails this new check;
the candidate passes. This is a scoped regression check, not a general security
or bundler-compatibility proof; a changed Next.js manifest format fails closed.

## Final comparison

Five alternating fresh-Chrome mobile runs per variant, plus one desktop run
each. Same Lighthouse 12.6.1/default simulated throttling, both local standalone
builds, no settings/threshold changes. Compare against the **post-font** baseline,
not the older pre-font build; do not add percentages from separate batches.

| Metric | Post-font baseline | Split copy |
|---|---:|---:|
| Mobile LCP samples, seconds | 2.371 / 2.529 / 2.509 / 2.517 / 1.957 | 2.374 / 2.521 / 2.360 / 2.380 / 2.512 |
| Median mobile LCP | 2.509s | 2.380s |
| Median mobile FCP | 0.907s | 0.908s |
| Median mobile TBT | 47.565ms | 37.5ms |
| Median mobile performance | 97 | 98 |
| Script transfer in sampled Home navigation | 150,284 bytes | 148,635 bytes |
| Font transfer | 49,272 bytes | 49,272 bytes |
| HTML transfer | 15,173 bytes | 15,174 bytes |
| Desktop LCP, one sample | 0.554s | 0.560s |
| Desktop performance / TBT | 100 / 0 | 100 / 0 |
| Accessibility / CLS, every run | 100 / 0 | 100 / 0 |

**The reproducible gain is 1,649 fewer JavaScript bytes (1.1%).** The median LCP
is lower in this batch, but sample ranges overlap substantially and framework
task attribution changes with timing. Do **not** claim a reliable 5.2% LCP gain
or a solved rendering bottleneck from this small copy-only change.

Supplemental Chromium check: DevTools-applied 150ms latency, 1.6Mbps download,
4× CPU, 412×823 viewport/DPR 1.75, three alternating fresh contexts per variant.
Observed LCP samples were 760/720/772ms versus 712/724/720ms (medians 760/720ms),
with CLS 0. These are synthetic browser observations, not field/device results
or a replacement for the established **simulated** Lighthouse gate. Despite
those sub-1.2s observations, **phase 7.8's <1.2s simulated goal remains unmet**.

## Verification and limits

- **424 application tests pass**, five opt-in Redis cases skipped. Lint,
  TypeScript, production standalone build and bundle scan pass (17 browser
  files, three catalog entry files, zero issues). No new MCP/Redis/provider run.
- At 320/412/1440px: unchanged headline geometry, visual review, no overflow,
  working keyboard skip link and zero axe violations in sampled Home states.
  Watchlist/Discover samples also have zero violations. Search, trending/week,
  pagination and save/reload/remove watchlist flows pass without page errors.
- Multilingual fallback requests and slow-font initial loading still pass;
  only the three UI fonts load initially. Optional-font behavior is unchanged.
- **Zero AI requests** across capture, comparison and browser review. No hosted
  diagnostic, quota reset, credential/provider change, push or deployment.
  User `PRD.md` and exact pre-task dev `next-env.d.ts` are preserved outside commits.
- Temporary servers/browsers are stopped. Session-only raw data lives under
  `/tmp/opencode/movie-render-{baseline,split}/`, `lcp-render-final-summary.json`
  and `movie-render-browser-summary.json`; this document is the durable record.

Next work should require evidence of actual pre-paint cost or a substantive
application dependency, not another tiny split justified only by a better
simulated sample. No framework migration, new service or metric workaround is
selected. Existing external release limitations remain open.
