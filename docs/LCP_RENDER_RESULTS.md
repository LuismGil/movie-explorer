# Render-path investigation — 2026-11-02

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
