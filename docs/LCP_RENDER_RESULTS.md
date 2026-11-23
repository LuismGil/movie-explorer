# Render-path investigation

## Post-release Lighthouse control

**Current policy:** the operator approved keeping simulated mobile median LCP <1,200ms as an advisory Lighthouse warning. The numeric target, three simulated mobile runs, fixture validation, accessibility and CLS error thresholds are unchanged. Lighthouse still retains reports and traces. The latest hosted controlled result (#41) was **2,395.46ms**, so a later green run with an LCP warning must not be presented as meeting the target. The release tag was not changed.

Local validation with Node 20 and the controlled fixture collected three samples and exited successfully with an LCP warning at **2,412.38ms** median; the summary surfaced the miss and all three traces were retained. Replaying saved reports with deliberately failing accessibility or CLS values still produced a nonzero exit for each. No new hosted result is claimed.

[CI #38](https://github.com/LuismGil/movie-explorer/actions/runs/45182718142) failed on the same application and budget that passed #37. Its downloaded reports show `h1#catalog-title` as LCP in all three runs. Observed LCP was **1,230 / 92 / 80ms** and simulated LCP **2,644 / 3,517 / 3,609ms**. All eight poster requests per run returned 2xx; accessibility 100 and CLS 0 held. This does not identify why Lantern's simulated render delay differed from the trace.

The local follow-up runs the actual standalone app against a deterministic popular-movie response and synthetic JPEGs of the configured poster widths. A loopback-only HTTPS proxy replaces those two TMDB hosts for the test, rejects other targets, and uses an ephemeral certificate trusted only by the test processes. Neither the app bundle nor the Lighthouse assertions are changed. The browser comes from the Playwright version in the lockfile. The runner retains per-sample reports, traces and DevTools logs even when the budget assertion fails. CI's separate push-only live catalog check uses the repository secret, does not send it to Lighthouse, and prints no request URL. It does not run on fork PRs.

Two local batches against the same existing standalone build (copied without `.env`), Lighthouse 12.6.1 and pinned Chrome for Testing 148.0.7778.96, produced:

| Batch | Simulated LCP samples (ms) | Median | Observed LCP (ms) |
|---|---|---:|---|
| 1 | 2,428.96 / 2,343.85 / 2,361.80 | **2,361.80 — fail** | 239 / 136 / 175 |
| 2 | 2,343.97 / 2,344.69 / 2,350.45 | **2,344.69 — fail** | 285 / 171 / 147 |

All six measured the title with eight successful fixture poster requests, accessibility 100 and CLS 0. The fixture uses local HTTPS and fixed JPEGs, not TMDB's production transport or CDN; Chrome also differs from #38 (157). These results reproduce the failing gate without live TMDB but are not a like-for-like speedup or evidence that the fixture fixes LCP. No hosted run or real credential check was performed for the local batches. Thresholds and `v2.0.0` remain unchanged.

To reproduce locally with the installed browser and an existing standalone build: `LIGHTHOUSE_WORKSPACE="$(mktemp -d)" node scripts/run-lighthouse-ci.mjs`. Read the `.lighthouseci` reports, traces and DevTools logs under that workspace. Use a new workspace for every batch; the runner refuses to combine old and new reports.

[CI #39](https://github.com/LuismGil/movie-explorer/actions/runs/45189575299) stopped before Lighthouse collection: port 3000 was still occupied after the accessibility audit. The separate live TMDB check passed; no performance samples or report artifact were produced. The follow-up starts and waits for the actual accessibility server process rather than its npm wrapper, gives Lighthouse its own loopback port 3100, and waits for the Lighthouse server's own readiness output. The simulated settings and budget assertions remain unchanged.

The next hosted run reached port 3100 but exited on an unhandled socket `ECONNRESET`; Next.js's subsequent fixture connection was refused. The loopback proxy now handles resets from the moment a TCP socket is accepted, before CONNECT or TLS can install a tunnel handler. A local Node 20.19.5 test survived 80 deliberate resets and still rejected an unlisted CONNECT target. A separate full Node 20.19.5 batch collected all three traces and loaded eight fixture posters per run; simulated median LCP was **2,351.20ms**, still above budget. The supplied earlier passing log reports **1,066.37 / 1,058.59 / 1,056.61ms** under the former live-TMDB setup; it does not verify the fixture path or identify the cause of the LCP difference.

### Local poster-priority experiment

Hosted [CI #41](https://github.com/LuismGil/movie-explorer/actions/runs/45198722236) completed collection and the live TMDB check but failed simulated LCP at a **2,395.46ms** median. The tag remains unchanged. To test resource scheduling without deploying again, three batches ran on the same Node 20/pinned Chrome/fixture setup, using temporary copies of the same compiled standalone build with only the poster-loading attribute varied:

| Variant | Simulated LCP samples (ms) | Median (ms) |
|---|---|---:|
| Existing first four posters `fetchpriority="high"` | 2,432.79 / 2,356.04 / 2,339.98 | 2,356.04 |
| First four `fetchpriority="low"` | 1,444.10 / 1,359.76 / 1,430.59 | 1,430.59 |
| All posters `loading="lazy"` | 1,437.84 / 1,213.84 / 1,432.25 | 1,432.25 |

The title remained the LCP element; eight posters loaded per sample, accessibility stayed 100 and CLS stayed 0. Lowering poster priority improved the simulated median by **39.3%** in this comparison, not the observed median (169ms baseline versus 172ms at low priority). Neither variant met <1,200ms. No app-source change, hosted run or deployment was made for the experiment.

Keeping the low-priority poster variant, dropping only the JetBrains Mono preload (not the font) produced local medians of **1,357.50ms** and **1,361.13ms** in two batches. Dropping Hanken's preload as well, leaving only the title's Sora preload, produced **1,353.31ms** in one batch. Each still loaded eight fixture posters per sample and failed the unchanged LCP gate. The small extra change from removing Hanken's preload does not justify retaining it without more evidence. These were temporary compiled-build experiments, not application changes or deployments.

## R9 candidate CI closeout

[GitHub Actions #37](https://github.com/LuismGil/movie-explorer/actions/runs/44645358587) completed successfully for full SHA `381dff6f0ee76117d65f56c980a358730241329a`. The Next.js standalone job passed accessibility, the unchanged Lighthouse thresholds (three simulated mobile runs, median LCP <1,200ms, accessibility 100 and CLS <0.05), and the Docker build smoke test. The MCP job also passed. Vercel's status for the same SHA reports `Deployment has completed`.

GitHub lists the [Lighthouse report artifact](https://github.com/LuismGil/movie-explorer/actions/runs/44645358587/artifacts/14587359816) as `lighthouse-reports-attempt-1`. Exact hosted timings and poster counts were not independently read from it. This closes the CI/deployment-status gate for this SHA, not the root cause of #36's failures or performance measured against the deployed Vercel URL. No rerun was needed.

## R9 CI rerun and diagnostic — 2026-11-19

[Run #36, attempt 2](https://github.com/LuismGil/movie-explorer/actions/runs/42733042364/attempts/2) tested the same `0632582` SHA. The Lighthouse log shows LCP samples **1,559.460555 / 3,144.859875 / 3,212.159875ms**. The median failed the unchanged gate; Docker was skipped. GitHub lists no report artifacts. The operator confirms `TMDB_API_KEY` is listed under GitHub Actions repository secrets; the existing log does not show whether the audited home rendered movie cards or an error.

The diagnostic workflow records whether the secret was supplied (not whether it is valid), without logging its value. The existing `dummy` fallback is explicitly reported when used. After Lighthouse, a read-only summary lists per-run simulated LCP, observed document response time and counts of TMDB poster requests and successful responses. A poster request indicates the measured document rendered catalog data; zero requests alone does not prove an error. Open the corresponding report screenshot to distinguish the populated, empty and error states, then inspect the LCP element and breakdown in the report. The summary issues no requests and cannot warm the measured server.

The authorized diagnostic uploads `lighthouse-reports-attempt-<n>` to the run's **Artifacts** section, even if the Lighthouse assertion fails. It includes only the collected HTML/JSON reports and assertion results; retention is seven days. No app code or Lighthouse budget changed, and Docker still runs only after the preceding gates pass. Rerunning #36 will not exercise it; #37 ran the diagnostic candidate.

Local checks: the workflow YAML parses with existing gates intact; a shell stub verified the secret presence/fallback branches without exposing the supplied value. The summary works with saved reports and synthetic missing/empty/failed image cases. In an isolated offline simulation using existing reports and injected failing timings, the real LHCI assertion failed at the original budget and retained all three reports plus the assertion JSON. GitHub artifact upload was subsequently verified on the passing #37 run.

## R9 CI comparison — 2026-11-09

The authorized push produced candidate `0632582c40f8c717a6691d861ecf165732719b94` and [CI run #36](https://github.com/LuismGil/movie-explorer/actions/runs/42733042364). Browser installation on pinned Ubuntu 24.04 and the accessibility/MCP checks passed. Lighthouse failed: samples **1,207.2798 / 1,206.78 / 1,207.2577ms**, median **1,207.2577ms**. Docker was skipped. Vercel's status for that exact commit reports deployment completed. This is not a passing complete CI.

The workflow uses `${{ secrets.TMDB_API_KEY || 'dummy' }}` for its browser audits. Two local three-run batches against the **same existing standalone build and unchanged `lighthouserc.json`** distinguish an important configuration effect:

| Local configuration | LCP samples (ms) | Median | Page evidence |
|---|---|---:|---|
| Explicit `TMDB_API_KEY=dummy` | 1,228.8046 / 1,222.6262 / 1,215.4517 | **1,222.6262ms — fail** | Catalog error state; no poster requests |
| Existing valid local catalog configuration | 1,066.2166 / 1,062.4098 / 1,060.4683 | **1,062.4098ms — pass** | Populated catalog; 8 poster requests per run; accessibility 100 / CLS 0 |

The LCP node in the inspected failing local report remains `h1#catalog-title`. These samples do **not** prove the remote secret was missing/invalid or isolate all timing causes. They justified checking that a valid **GitHub Actions** repository secret named `TMDB_API_KEY` was available; configuring it in Vercel alone does not supply it to GitHub Actions. No credential value was printed/read for this comparison. No fonts, source UI, Lighthouse settings, thresholds or workflow were changed. No Google/MCP/admission call or extra deployment was made for this comparison. The newer passing candidate is documented in the R9 closeout above.

## R2 local closeout — 2026-11-06

The original acceptance criteria and `lighthouserc.json` are unchanged: mobile
simulated three-run **median LCP <1,200ms**, accessibility **100**, and
**CLS <0.05**. The prior R1/R3 commit is `4a4f1ce`. The R2 implementation and
this evidence are committed and pushed to `main` as `3fe0b6b`. Subsequent
production GETs served the shell and `/discover` returned HTTP 200, confirming
the content is reachable; no Vercel dashboard Ready state or hosted Lighthouse
verification was independently established. The pre-existing `PRD.md` and exact
working-tree state of `next-env.d.ts` are preserved.

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
